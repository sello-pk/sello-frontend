

import React, { useState } from "react";

export default function LoanCalculator() {
  const AMOUNT_MIN = 1000000;
  const AMOUNT_MAX = 17480000;
  const AMOUNT_STEP = 100000;
  const PERIOD_MIN = 6;
  const PERIOD_MAX = 18;

  const [tab, setTab] = useState("used");
  const [loanAmount, setLoanAmount] = useState(9000000);
  const [loanPeriod, setLoanPeriod] = useState(9);

  const pctAmount =
    ((loanAmount - AMOUNT_MIN) / (AMOUNT_MAX - AMOUNT_MIN)) * 100;
  const pctPeriod =
    ((loanPeriod - PERIOD_MIN) / (PERIOD_MAX - PERIOD_MIN)) * 100;

  const fmt = (n) => new Intl.NumberFormat("de-DE").format(n);

  return (
    <div className="flex h-full w-full md:w-[70%] items-center justify-center px-2 md:px-0">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden p-4 space-y-6">
        {/* Tabs */}
        <div className="rounded-lg border border-black p-1 bg-white flex items-center gap-1">
          <button
            onClick={() => setTab("new")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              tab === "new"
                ? "bg-[#071428] text-white"
                : "bg-white text-gray-700"
            }`}
          >
            New
          </button>
          <button
            onClick={() => setTab("used")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              tab === "used"
                ? "bg-[#071428] text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Used
          </button>
        </div>

        {/* Maximum Funding */}
        <div className="border border-black rounded-xl h-32 p-2 relative flex flex-col justify-between">
          <div className="text-center text-xs text-gray-400">
            Maximum Funding
          </div>
          <div className="flex-1 flex items-center">
            <div className="h-px bg-black w-full" />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div>2022</div>
            <div className="opacity-80">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 6h10"
                  stroke="#111827"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <path
                  d="M6 6h.01"
                  stroke="#111827"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <path
                  d="M6 12h6"
                  stroke="#111827"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <path
                  d="M6 18h10"
                  stroke="#111827"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="6" r="1" fill="#111827" />
              </svg>
            </div>
          </div>
        </div>

        {/* Loan Amount */}
        <div className="border border-black rounded-xl p-3 space-y-3">
          <div className="text-sm text-gray-500">Loan Amount</div>
          <input
            type="range"
            min={AMOUNT_MIN}
            max={AMOUNT_MAX}
            step={AMOUNT_STEP}
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full range"
            style={{
              background: `linear-gradient(90deg, #0f1724 ${pctAmount}%, #e6e6e6 ${pctAmount}%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>{fmt(AMOUNT_MIN)}</span>
            <span>{fmt(AMOUNT_MAX)}</span>
          </div>
          <div className="text-center text-sm font-medium text-gray-700">
            {fmt(loanAmount)}
          </div>
        </div>

        {/* Loan Period */}
        <div className="border border-black rounded-xl p-4 space-y-2">
          <div className="text-sm text-gray-500">Loan Period</div>
          <input
            type="range"
            min={PERIOD_MIN}
            max={PERIOD_MAX}
            step={1}
            value={loanPeriod}
            onChange={(e) => setLoanPeriod(Number(e.target.value))}
            className="w-full range"
            style={{
              background: `linear-gradient(90deg, #0f1724 ${pctPeriod}%, #e6e6e6 ${pctPeriod}%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>6 Months</span>
            <span>18 Months</span>
          </div>
          <div className="text-center text-sm font-medium text-gray-700">
            {loanPeriod} Months
          </div>
        </div>

        {/* Search Button */}
        <button className="w-full bg-primary-500 hover:opacity-90 text-white rounded-xl py-2 flex justify-center items-center font-medium gap-2 transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Search
        </button>

        <style>{`
          .range { -webkit-appearance: none; appearance: none; height: 10px; border-radius: 9999px; background: linear-gradient(90deg,#0f1724 50%, #e6e6e6 50%); }
          .range:focus{ outline: none; }
          .range::-webkit-slider-thumb{ -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 9999px; border: 4px solid #ffffff; background: #0f1724; box-shadow: 0 0 0 3px rgba(15,23,36,0.06); margin-top: -6px; cursor: pointer; }
          .range::-moz-range-thumb{ width: 20px; height: 20px; border-radius: 9999px; border: 4px solid #ffffff; background: #0f1724; box-shadow: 0 0 0 3px rgba(15,23,36,0.06); cursor: pointer; }
          input[type=range]::-moz-range-track{ height:10px; border-radius:9999px; background: transparent; }
        `}</style>
      </div>
    </div>
  );
}
