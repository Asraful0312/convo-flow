import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface CompletionScreenProps {
  secondaryColor: string;
}

export default function CompletionScreen({ secondaryColor }: CompletionScreenProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex justify-center mt-6"
    >
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-4 max-w-md shadow-sm">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: `${secondaryColor}20` }}>
          <Check className="w-8 h-8" style={{ color: secondaryColor }} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">All done!</h3>
        <p className="text-gray-600">Thanks for completing the form. We'll be in touch soon.</p>
      </div>
    </motion.div>
  );
}