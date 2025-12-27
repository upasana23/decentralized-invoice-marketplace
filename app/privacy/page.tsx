import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: December 27, 2025
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Privacy Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              At InvoChain, we take your privacy seriously. We follow a privacy-by-design approach, 
              collecting only the information necessary to provide and improve our services while 
              maintaining the highest standards of data protection.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">We collect:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Basic account information (name, email)</li>
                <li>User role (MSME, Investor, or Buyer)</li>
                <li>Public blockchain wallet address</li>
                <li>Invoice metadata (amounts, dates, status - no sensitive content)</li>
                <li>Transaction history related to platform usage</li>
              </ul>
            </div>

            <div className="pt-2">
              <h3 className="font-medium mb-2">We do NOT collect:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Private keys or seed phrases</li>
                <li>Bank account passwords or credentials</li>
                <li>Government-issued identification numbers</li>
                <li>Personal financial information beyond what's needed for KYC</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and maintain our services</li>
              <li>Process transactions and display relevant information</li>
              <li>Improve and optimize platform functionality</li>
              <li>Communicate important service updates</li>
              <li>Ensure platform security and prevent fraud</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Blockchain Transparency Notice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Transactions on InvoChain are recorded on the blockchain, which is a public ledger. This means:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Transaction details are visible to anyone with access to the blockchain</li>
              <li>Wallet addresses and transaction hashes are publicly accessible</li>
              <li>Once recorded, transactions cannot be altered or deleted</li>
            </ul>
            <p className="pt-2">
              We take measures to protect your privacy, but please be aware that blockchain transactions 
              are inherently transparent by design.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Measures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Regular security audits and testing</li>
              <li>Minimal data retention policies</li>
              <li>Secure authentication mechanisms</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policy Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We may update this Privacy Policy from time to time. We'll notify you of any changes by 
              posting the new policy on this page and updating the "Last updated" date. Your continued 
              use of our services after any modifications constitutes your acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
