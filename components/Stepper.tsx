
import React from 'react';
import { AppStep } from '../types';
import { CheckIcon } from './icons/Icon';

interface StepperProps {
  currentStep: AppStep;
  steps: AppStep[];
}

const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            {stepIdx < currentStepIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-indigo-600" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center bg-indigo-600 rounded-full">
                  <CheckIcon />
                </div>
                <span className="absolute -bottom-6 text-sm font-medium text-slate-700">{step}</span>
              </>
            ) : stepIdx === currentStepIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center bg-white border-2 border-indigo-600 rounded-full" aria-current="step">
                  <span className="h-2.5 w-2.5 bg-indigo-600 rounded-full" />
                </div>
                <span className="absolute -bottom-6 text-sm font-semibold text-indigo-600">{step}</span>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div className="group relative flex h-8 w-8 items-center justify-center bg-white border-2 border-gray-300 rounded-full">
                  <span className="h-2.5 w-2.5 bg-transparent rounded-full" />
                </div>
                <span className="absolute -bottom-6 text-sm font-medium text-gray-500">{step}</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Stepper;