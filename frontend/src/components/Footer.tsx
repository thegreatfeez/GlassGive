import Image from 'next/image';

import charityIcon from '../assets/icon/charity-icon.svg';
import hederaIcon from '../assets/icon/hedera-icon.png';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="flex w-full flex-wrap items-start justify-between gap-6 px-6 py-8 text-sm text-slate-500">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200">
              <Image src={charityIcon} alt="GlassGive" className="h-4 w-4" />
            </span>
            GlassGive
          </div>
          <p>Democratising charity through radical transparency.</p>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            Powered by
          </p>
          <div className="mt-2 flex items-center justify-end gap-2 text-slate-900">
            <Image src={hederaIcon} alt="Hedera" className="h-6 w-6" />
            <span className="text-base font-semibold">Hedera</span>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-6 py-4 text-xs text-slate-400">
        <span>© {year} GlassGive Dashboard. All rights reserved.</span>
        <div className="flex flex-wrap items-center gap-6">
          <span>Privacy Policy</span>
          <span>Smart Contract Audit</span>
          <span>Whitepaper</span>
        </div>
      </div>
    </footer>
  );
}
