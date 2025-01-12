export type AlertType = "price" | "percentage" | "volume";

interface ValidationResult {
  isValid: boolean;
  errorMessage: string;
}

export const validateAlertInput = (
  alertType: AlertType,
  values: {
    targetPrice?: string;
    percentage?: string;
    volume?: string;
  }
): ValidationResult => {
  const { targetPrice, percentage, volume } = values;

  switch (alertType) {
    case "price":
      if (!targetPrice || isNaN(parseFloat(targetPrice)) || parseFloat(targetPrice) <= 0) {
        return {
          isValid: false,
          errorMessage: "Please enter a valid target price greater than 0",
        };
      }
      break;
    case "percentage":
      if (!percentage || isNaN(parseFloat(percentage))) {
        return {
          isValid: false,
          errorMessage: "Please enter a valid percentage",
        };
      }
      break;
    case "volume":
      if (!volume || isNaN(parseFloat(volume)) || parseFloat(volume) <= 0) {
        return {
          isValid: false,
          errorMessage: "Please enter a valid volume threshold greater than 0",
        };
      }
      break;
  }

  return { isValid: true, errorMessage: "" };
};