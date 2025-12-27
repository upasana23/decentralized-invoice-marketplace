import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Terms & Conditions</h1>
          <p className="text-muted-foreground">
            Last updated: December 27, 2025
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              By accessing or using the InvoChain platform ("Platform"), you agree to be bound by these 
              Terms and Conditions ("Terms"). If you do not agree with any part of these Terms, you must 
              not use our Platform.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Nature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              InvoChain is a technology platform that connects MSMEs with investors for invoice financing 
              using blockchain technology. Please note that:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>We are not a bank or financial institution</li>
              <li>We do not provide financial, legal, or tax advice</li>
              <li>We do not guarantee returns on investments</li>
              <li>We are not a party to the agreements between MSMEs and investors</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>By using InvoChain, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not engage in fraudulent or illegal activities</li>
              <li>Be solely responsible for your wallet and private keys</li>
              <li>Conduct your own due diligence before making investment decisions</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Disclosure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-medium">
              Using InvoChain involves certain risks that you should understand:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-medium">Investment Risk:</span> Invoice financing carries risk of non-payment or delayed payment
              </li>
              <li>
                <span className="font-medium">Blockchain Risk:</span> Smart contracts are immutable and transactions cannot be reversed
              </li>
              <li>
                <span className="font-medium">Technology Risk:</span> The Platform may experience downtime or technical issues
              </li>
              <li>
                <span className="font-medium">Regulatory Risk:</span> Laws and regulations may change and affect the Platform's operations
              </li>
              <li>
                <span className="font-medium">Market Risk:</span> The value of digital assets may fluctuate
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>No Guarantees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              InvoChain makes no representations, warranties, or guarantees regarding:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>The accuracy or completeness of any information on the Platform</li>
              <li>The performance or profitability of any investment</li>
              <li>The uninterrupted or error-free operation of the Platform</li>
              <li>The quality, safety, or legality of any invoice or transaction</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              To the maximum extent permitted by law, InvoChain and its affiliates shall not be liable for:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Any direct, indirect, incidental, or consequential damages</li>
              <li>Loss of profits, revenue, or data</li>
              <li>Errors or inaccuracies in the Platform's content</li>
              <li>Unauthorized access to or use of your account</li>
              <li>Actions or inactions of other users or third parties</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Governing Law</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], 
              without regard to its conflict of law principles. Any disputes arising from these Terms or your 
              use of the Platform shall be resolved in the courts of [Your Jurisdiction].
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              We reserve the right to modify these Terms at any time. We'll notify you of significant changes 
              through the Platform or via email. Your continued use of the Platform after such changes 
              constitutes your acceptance of the new Terms.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
