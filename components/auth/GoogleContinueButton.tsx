'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/Button';

type GoogleContinueButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export function GoogleContinueButton({ onClick, disabled }: GoogleContinueButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className="w-full gap-2.5 border-[oklch(0.566_0.005_157.095)] bg-[oklch(1_0_0)] text-[oklch(0.239_0_0)] hover:bg-[oklch(0.982_0.002_247.839)] hover:text-[oklch(0.239_0_0)] dark:border-[oklch(0.654_0.005_157.123)] dark:bg-[oklch(0.187_0.002_286.205)] dark:text-[oklch(0.916_0_0)] dark:hover:bg-[oklch(0.285_0.002_286.285)] dark:hover:text-[oklch(0.916_0_0)]"
    >
      <Image
        src="/brand/google-g.png"
        alt=""
        aria-hidden
        width={18}
        height={18}
        className="size-[18px]"
      />
      Continue with Google
    </Button>
  );
}
