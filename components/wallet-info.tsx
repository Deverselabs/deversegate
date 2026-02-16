'use client';

import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, Check, X } from 'lucide-react';

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletInfo() {
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });
  const { disconnect } = useDisconnect();

  return (
    <Card className="border-2 border-amber-500/30 bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <CardTitle className="text-lg bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
              Wallet
            </CardTitle>
            <CardDescription>
              {isConnected ? 'Your connected wallet' : 'Connect to use crypto features'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected && address ? (
          <>
            <div className="space-y-3 rounded-xl bg-muted/50 border border-border p-4">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium text-muted-foreground">Address</span>
                <span className="font-mono text-sm font-medium truncate ml-auto">
                  {shortenAddress(address)}
                </span>
              </div>
              {balance && (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm font-medium text-muted-foreground">Balance</span>
                  <span className="font-medium ml-auto">
                    {Number(balance.formatted).toFixed(4)} {balance.symbol}
                  </span>
                </div>
              )}
              {chain && (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm font-medium text-muted-foreground">Network</span>
                  <span className="font-medium ml-auto">{chain.name}</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnect()}
              className="w-full border-amber-500/30 text-muted-foreground hover:text-foreground hover:border-amber-500/50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 rounded-xl bg-muted/50 border border-border">
              <X className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">No wallet connected</span>
            </div>
            <div className="[&_.rainbow-kit-connect-button]:!rounded-xl [&_.rainbow-kit-connect-button]:!bg-gradient-to-r [&_.rainbow-kit-connect-button]:!from-amber-500 [&_.rainbow-kit-connect-button]:!to-red-600 [&_.rainbow-kit-connect-button]:!border-0 [&_.rainbow-kit-connect-button]:!text-white [&_.rainbow-kit-connect-button]:!font-medium [&_.rainbow-kit-connect-button]:!w-full [&_.rainbow-kit-connect-button]:!justify-center">
              <ConnectButton />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
