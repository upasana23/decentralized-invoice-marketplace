import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">About InvoChain</h1>
          <p className="text-muted-foreground">
            Empowering MSMEs with instant liquidity through decentralized invoice financing
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>About the Platform</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Small and medium enterprises often face cash flow challenges due to delayed invoice payments, 
              sometimes waiting 60-90 days to get paid. This creates unnecessary financial strain and 
              limits growth opportunities.
            </p>
            <p>
              InvoChain solves this by connecting MSMEs with investors who can purchase their outstanding 
              invoices for immediate liquidity. Our platform uses blockchain technology and smart contracts 
              to create a transparent, efficient marketplace where businesses get paid faster and investors 
              earn attractive returns.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What the Platform Enables</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 list-disc pl-5">
              <li>
                <span className="font-medium">Instant liquidity</span> for MSMEs without requiring traditional collateral
              </li>
              <li>
                <span className="font-medium">Transparent investments</span> backed by real invoices with clear terms
              </li>
              <li>
                <span className="font-medium">Automated settlements</span> through self-executing smart contracts
              </li>
              <li>
                <span className="font-medium">Reduced dependency</span> on traditional banking systems and intermediaries
              </li>
              <li>
                <span className="font-medium">Global access</span> to financing opportunities 24/7
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-lg font-medium">
                At InvoChain, we're building a future where every business has equal access to working capital, 
                where trust is established through technology, and where financial services are borderless and 
                accessible to all.
              </p>
              <p>
                We believe in creating transparent financial systems that empower MSMEs to thrive, investors 
                to find meaningful opportunities, and the global economy to grow more equitably.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
