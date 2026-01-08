"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Info, Loader2, UploadCloud, FileText, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ethers } from "ethers"
import { useRouter } from "next/navigation"
import InvoiceMarketplaceABI from "@/lib/contracts/InvoiceMarketplace.json"

type InvoiceFormState = {
  buyerAddress: string
  amount: string
  dueDate: string
  discountRate: string
  metadataURI: string
}

export default function TokenizeInvoice() {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // --- New State for File Upload ---
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // -------------------------------

  const [formData, setFormData] = useState<InvoiceFormState>({
    buyerAddress: "",
    amount: "",
    dueDate: "",
    discountRate: "",
    metadataURI: ""
  })

  // --- File Upload Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile)
        // Auto-fill description with filename if empty
        setFormData(prev => ({ 
            ...prev, 
            metadataURI: prev.metadataURI || `Invoice: ${droppedFile.name}` 
        }))
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive"
        })
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files
  if (!files || !files[0]) {
    return
  }

  const selectedFile = files[0]
  setFile(selectedFile)
  // Auto-fill description with filename if empty
  setFormData(prev => ({ 
    ...prev, 
    metadataURI: prev.metadataURI || `Invoice: ${selectedFile.name}` 
  }))
}

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }
  // ---------------------------

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      toast({
        title: "Missing Invoice",
        description: "Please upload the actual invoice PDF.",
        variant: "destructive"
      })
      return
    }

    if (!window.ethereum) {
      toast({
        title: "Error",
        description: "Please install MetaMask to continue.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Connect to MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const network = await provider.getNetwork()
      
      // Check if connected to Polygon Amoy (chainId: 80002)
      if (network.chainId.toString() !== '80002') {
        toast({
          title: "Wrong Network",
          description: "Please switch to Polygon Amoy Testnet",
          variant: "destructive"
        })
        return
      }
      
      const msmeAddress = await signer.getAddress()

      const ipfsFormData = new FormData()
      ipfsFormData.append("file", file)
      ipfsFormData.append("buyerAddress", formData.buyerAddress)
      ipfsFormData.append("msmeAddress", msmeAddress)
      ipfsFormData.append("amount", formData.amount)
      ipfsFormData.append("dueDate", formData.dueDate)
      ipfsFormData.append("currency", "MATIC")
      ipfsFormData.append("discountRate", formData.discountRate)
      if (formData.metadataURI) {
        ipfsFormData.append("description", formData.metadataURI)
      }

      const ipfsResponse = await fetch("/api/invoices/ipfs", {
        method: "POST",
        body: ipfsFormData,
      })

      const ipfsJson = await ipfsResponse.json().catch(() => null as any)

      if (!ipfsResponse.ok) {
        const message = (ipfsJson && ipfsJson.error) || "Failed to upload invoice to IPFS"
        throw new Error(message)
      }

      const metadataUri: string | undefined = ipfsJson?.metadataUri

      if (!metadataUri) {
        throw new Error("IPFS upload did not return metadata URI")
      }
      
      // Get contract instance
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      if (!contractAddress) {
        throw new Error("Contract address not configured")
      }
      
      const contract = new ethers.Contract(
        contractAddress,
        InvoiceMarketplaceABI.abi,
        signer
      )
      
      // Convert values
      const amountInWei = ethers.parseEther(formData.amount)
      const dueDateTimestamp = Math.floor(new Date(formData.dueDate).getTime() / 1000)
      const discountRateBps = Math.floor(parseFloat(formData.discountRate) * 100)
      
      // Call the contract
      const tx = await contract.createInvoice(
        formData.buyerAddress,
        amountInWei,
        dueDateTimestamp,
        discountRateBps,
        metadataUri 
      )
      
      await tx.wait()
      
      toast({
        title: "Success!",
        description: "Invoice created successfully on the blockchain.",
      })
      
      router.push("/dashboard/msme/active")
      
    } catch (error: any) {
      console.error("Error creating invoice:", error)
      
      let errorMessage = "Failed to create invoice"
      if (error.code === 4001) {
        errorMessage = "Transaction was rejected"
      } else if (error.message && error.message.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction"
      } else if (error.message) {
        const match = error.message.match(/reason:"([^"]*)"/) || 
                      error.message.match(/reverted with reason string '([^']*)'/) ||
                      []
        errorMessage = match[1] || error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tokenize New Invoice</h1>
        <p className="text-muted-foreground">Convert your unpaid receivables into instant liquidity.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Invoice Details</CardTitle>
              <CardDescription>Enter the details of the invoice you want to tokenize.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* --- IPFS File Uploader Section --- */}
              <div className="space-y-2">
                <Label>Upload Invoice (PDF)</Label>
                {!file ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                      flex flex-col items-center justify-center gap-2
                      ${isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:bg-muted/50"}
                    `}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="application/pdf"
                      onChange={handleFileInput}
                    />
                    <div className="p-3 rounded-full bg-background border shadow-sm">
                        <UploadCloud className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PDF (max 10MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={removeFile}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>
              {/* ---------------------------------- */}

              <div className="space-y-2">
                <Label htmlFor="buyerAddress">Buyer's Wallet Address</Label>
                <Input 
                  id="buyerAddress" 
                  name="buyerAddress"
                  value={formData.buyerAddress}
                  onChange={handleChange}
                  placeholder="0x..." 
                  required 
                  className="font-mono bg-background/50"
                />
                <p className="text-xs text-muted-foreground">The buyer's wallet address that will be responsible for repayment</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (MATIC)</Label>
                  <Input 
                    id="amount" 
                    name="amount"
                    type="number" 
                    step="0.000000000000000001"
                    min="0"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="1.0" 
                    required 
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountRate">Discount Rate (%)</Label>
                  <Input 
                    id="discountRate" 
                    name="discountRate"
                    type="number" 
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.discountRate}
                    onChange={handleChange}
                    placeholder="5.0" 
                    required 
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">Early payment discount rate</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input 
                  id="dueDate" 
                  name="dueDate"
                  type="date" 
                  value={formData.dueDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required 
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metadataURI">Description (Optional)</Label>
                <textarea
                  id="metadataURI"
                  name="metadataURI"
                  value={formData.metadataURI}
                  onChange={handleChange}
                  placeholder="Add a description or reference for this invoice"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </CardContent>
          </Card>

          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex gap-4">
            <Info className="size-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Important Information</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
                <li>By creating this invoice, you agree to list it on the public marketplace</li>
                <li>Once funded, the buyer will have until the due date to repay the full amount</li>
                <li>Early repayments will include the specified discount rate</li>
                <li>You will receive the funded amount immediately, minus a 1.5% protocol fee</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Create Invoice'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}