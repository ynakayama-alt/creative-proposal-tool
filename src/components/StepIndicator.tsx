"use client";

type Step = {
  label: string;
};

type StepIndicatorProps = {
  currentStep: number;
  steps?: Step[];
};

const defaultSteps: Step[] = [
  { label: "情報入力" },
  { label: "調査・収集" },
  { label: "画像生成" },
  { label: "画像選択" },
  { label: "資料作成" },
];

export default function StepIndicator({
  currentStep,
  steps = defaultSteps,
}: StepIndicatorProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isFuture = stepNumber > currentStep;

          return (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                    isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : isCurrent
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium whitespace-nowrap ${
                    isCompleted
                      ? "text-green-600"
                      : isCurrent
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-0.5 mx-2 mb-6 ${
                    stepNumber < currentStep ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
