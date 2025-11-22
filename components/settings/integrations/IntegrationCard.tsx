import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

type Integration = {
  name: string;
  type: string;
  description: string;
  iconSrc: string;
  connected: boolean;
  id?: string;
  config?: any;
  lastError?: string;
  lastErrorTimestamp?: number;
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

      {integration.lastError && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-sm text-red-600 dark:text-red-400">
                Integration Error
              </p>
              <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-1">
                {integration.lastError}
              </p>
              {integration.lastErrorTimestamp && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last occurred:{" "}
                  {new Date(integration.lastErrorTimestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {children}
    </motion.div>
  );
}
