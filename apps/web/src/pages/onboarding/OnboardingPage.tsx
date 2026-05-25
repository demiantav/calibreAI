import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ConnectYouTube from './steps/ConnectYouTube';
import ConnectGmail from './steps/ConnectGmail';
import FirstPulse from './steps/FirstPulse';

const STEPS = [
  { number: 1, label: 'Conectar YouTube' },
  { number: 2, label: 'Conectar Gmail' },
  { number: 3, label: 'Primer análisis' },
];

export default function OnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get current step from URL, but enforce sequence based on user progress
  // User can only access their current step or the next one
  const urlStep = parseInt(searchParams.get('step') || '1', 10);
  const userProgress = user?.onboarding_step || 1;
  const allowedStep = Math.min(Math.max(urlStep, 1), userProgress + 1, 3);
  const currentStep = allowedStep;

  // Redirect if URL step is ahead of user's progress
  useEffect(() => {
    if (urlStep > userProgress + 1) {
      navigate(`/onboarding?step=${userProgress + 1}`, { replace: true });
    }
  }, [urlStep, userProgress, navigate]);

  const handleStepComplete = (nextStep: number) => {
    navigate(`/onboarding?step=${nextStep}`);
  };

  const handleOnboardingComplete = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-text">Configuración de Calibre</h1>
          <p className="text-text-secondary">Paso {currentStep} de 3</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          {STEPS.map((step) => (
            <div key={step.number} className="flex-1">
              <div
                className={`h-2 rounded-full transition-colors ${
                  step.number <= currentStep ? 'bg-accent' : 'bg-surface-raised'
                }`}
              />
              <p className={`text-xs mt-1.5 text-center ${
                step.number <= currentStep ? 'text-accent font-medium' : 'text-text-tertiary'
              }`}>
                {step.label}
              </p>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-lg">
          {currentStep === 1 && (
            <ConnectYouTube onComplete={() => handleStepComplete(2)} />
          )}
          {currentStep === 2 && (
            <ConnectGmail onComplete={() => handleStepComplete(3)} />
          )}
          {currentStep === 3 && (
            <FirstPulse onComplete={handleOnboardingComplete} />
          )}
        </div>
      </div>
    </div>
  );
}
