import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star, ShieldCheck, TrendingUp } from "lucide-react";

export default function ReputationSection() {
  const score = 82;
  const rating = 4.6;
  const onTimeRate = 95;

  const getLevel = () => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Low";
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Reputation & Investor Trust</h2>
        <p className="text-sm text-muted-foreground">
          How investors evaluate your business credibility
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">

        {/* Trust Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Trust Score</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold">{score}/100</div>
              <Badge variant="secondary">{getLevel()}</Badge>
            </div>
            <Progress value={score} />
            <p className="text-xs text-muted-foreground">
              Overall reliability based on repayment history
            </p>
          </CardContent>
        </Card>

        {/* Investor Rating */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Investor Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold">{rating}/5</div>
            <Progress value={(rating / 5) * 100} />
            <p className="text-xs text-muted-foreground">
              Average rating given by investors
            </p>
          </CardContent>
        </Card>

        {/* Payment Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Payment Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold">{onTimeRate}%</div>
            <Progress value={onTimeRate} />
            <p className="text-xs text-muted-foreground">
              Invoices paid on or before due date
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Investor View */}
      <div className="bg-muted/40 p-4 rounded-lg text-sm">
        <span className="font-medium">Investor View:</span>{" "}
        This MSME shows strong repayment discipline and low default risk, making it
        attractive for short-term liquidity investments.
      </div>
    </div>
  );
}
