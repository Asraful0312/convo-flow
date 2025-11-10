import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

type Integration = {
  name: string;
  type: string;
  description: string;
  iconSrc: string;
  connected: boolean;
  id?: string;
  config?: any;
};

type Props = {
  integration: Integration;
  onConnect: () => void;
  onDisconnect: () => void;
  children?: React.ReactNode;
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  children,
}: Props) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col gap-4 p-4 rounded-lg border border-border hover:border-[#F56A4D] transition-colors"
    >
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={integration.iconSrc}
            alt={integration.name}
            className="h-8 w-8 object-contain"
          />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{integration.name}</h4>
              {integration.connected && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <Check className="w-3 h-3 mr-1" /> Connected
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {integration.description}
            </p>
          </div>
        </div>
        {integration.connected ? (
          <Button variant="outline" size="sm" onClick={onDisconnect}>
            Disconnect
          </Button>
        ) : (
          <Button
            className="bg-[#F56A4D] hover:bg-[#F56A4D]"
            size="sm"
            onClick={onConnect}
          >
            Connect
          </Button>
        )}
      </div>
      {children}
    </motion.div>
  );
}
