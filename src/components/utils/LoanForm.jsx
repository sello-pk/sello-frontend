import React, { useState } from "react";
import { MdOutlineArrowOutward } from "react-icons/md";

const LoanForm = () => {
  const [price, setPrice] = useState(10000);
  const [rate, setRate] = useState(10);
  const [term, setTerm] = useState(3);
  const [downPayment, setDownPayment] = useState(5000);
  const [result, setResult] = useState(null);

  const handleCalculate = (e) => {
    e.preventDefault();

    const loanAmount = price - downPayment;
    const monthlyRate = rate / 100 / 12;
    const totalMonths = term * 12;

    let monthlyPayment = 0;

    if (monthlyRate > 0) {
      monthlyPayment =
        (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);
    } else {
      monthlyPayment = loanAmount / totalMonths; // 0% interest
    }

    setResult(monthlyPayment.toFixed(2));
  };

  return (
    <form
      onSubmit={handleCalculate}
      className=" p-6 rounded-lg max-w-2xl mx-auto"
    >
      {/* Input grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (AED)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Interest Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interest Rate (%)
          </label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Loan Term */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loan Term (years)
          </label>
          <input
            type="number"
            value={term}
            onChange={(e) => setTerm(Number(e.target.value))}
            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Down Payment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Down Payment
          </label>
          <input
            type="number"
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="mb-6 text-center text-lg font-semibold text-gray-800">
          Monthly Payment:{" "}
          <span className="text-primary-500">PKR {result}</span>
        </div>
      )}

      {/* Calculate Button */}
      <button
        type="submit"
        className="w-full bg-primary-500 text-white hover:opacity-90 font-medium py-4 rounded-xl transition-colors flex justify-center items-center gap-2"
      >
        Calculate{" "}
        <span className="text-xl">
          <MdOutlineArrowOutward />
        </span>
      </button>
    </form>
  );
};

export default LoanForm;
