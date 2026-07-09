"use client";

import React from 'react';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { SettingsProvider } from '../context/SettingsContext';
import { ReferralProvider } from '../context/ReferralContext';
import { LeadProvider } from '../context/LeadContext';
import { OpportunityProvider } from '../context/OpportunityContext';
import { CustomerProvider } from '../context/CustomerContext';
import { ActivityProvider } from '../context/ActivityContext';
import { QuotationProvider } from '../context/QuotationContext';
import { EmailProvider } from '../context/EmailContext';
import { PipelineProvider } from '../context/PipelineContext';
import { TaskProvider } from '../context/TaskContext';
import { NotificationProvider } from '../context/NotificationContext';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <SettingsProvider>
              <PipelineProvider>
              <ReferralProvider>
              <LeadProvider>
                <OpportunityProvider>
                  <CustomerProvider>
                    <ActivityProvider>
                      <QuotationProvider>
                        <EmailProvider>
                          <TaskProvider>
                            {children}
                          </TaskProvider>
                        </EmailProvider>
                      </QuotationProvider>
                    </ActivityProvider>
                  </CustomerProvider>
                </OpportunityProvider>
              </LeadProvider>
            </ReferralProvider>
            </PipelineProvider>
          </SettingsProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  );
};
