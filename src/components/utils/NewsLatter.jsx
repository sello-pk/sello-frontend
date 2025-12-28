import React, { useState } from "react";
import { useSubscribeNewsletterMutation } from "../../redux/services/api";
import toast from "react-hot-toast";

const NewsLatter = () => {
  const [email, setEmail] = useState("");
  const [subscribeNewsletter, { isLoading }] = useSubscribeNewsletterMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const result = await subscribeNewsletter(email).unwrap();
      toast.success(result?.message || "Successfully subscribed to our newsletter! Check your email for confirmation.");
      setEmail(""); // Clear input on success
    } catch (error) {
      // Handle error - might be duplicate subscription
      if (error?.data?.message) {
        toast.success(error.data.message); // Show as success if already subscribed
      } else {
        toast.error(error?.data?.message || "Failed to subscribe. Please try again.");
      }
    }
  };

  return (
    <div className="bg-[#050B20] flex md:flex-row flex-col items-center justify-between px-4 md:px-16 py-12">
      <div className="text-white md:py-10 py-5">
        <h2 className="md:text-4xl text-3xl py-4">Join Sello</h2>
        <p className="">Receive pricing updates, shopping tips & more.</p>
      </div>
      <div className="md:py-10 py-5">
        <form onSubmit={handleSubmit} className="field bg-white/20 h-12 sm:h-14 md:h-16 w-full max-w-md mx-auto px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 rounded-full">
          <input
            className="flex-1 h-full text-sm sm:text-base md:text-lg outline-none text-primary-500 bg-transparent border-none placeholder:text-primary-500/80"
            type="email"
            placeholder="Your Email Address..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="bg-primary-500 text-white text-xs sm:text-sm md:text-base py-1.5 px-3 sm:py-2 sm:px-4 md:py-3 md:px-6 rounded-full hover:opacity-90 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Subscribing..." : "Subscribe"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewsLatter;
