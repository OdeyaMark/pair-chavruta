import {  createClient } from "@wix/sdk";
import { functions } from "@wix/http-functions";

import { dashboard } from "@wix/dashboard";
import { createLogger } from '../utils/logger';

const logger = createLogger('sendEmails');

export async function sendWixEmail(contactDetails: { fName: string, lName: string, email: string, phone: string }, emailId: string, variables: any) {
    const client = createClient({
  host: dashboard.host(),
  auth: dashboard.auth(),
  modules: {
    dashboard,
    functions
  },
});
  try {
    const functionsClient = client as typeof client & {
      functions: {
        post: (path: string, options: { body: string; headers: Record<string, string> }) => Promise<Response>;
      };
    };
    const response = await functionsClient.functions.post("newSendEmail", {
      body: JSON.stringify({ 
      fName: contactDetails.fName, 
      lName: contactDetails.lName, 
      email: contactDetails.email, 
      phone: contactDetails.phone, 
      emailId, 
      variables 
    }),
    headers: { "Content-Type": "application/json" },
});
    const data = await response.json();
    logger.debug("Email sent successfully:", data);
    // Handle member data.
  } catch (error) {
    // Handle error.
    logger.error("Error sending email:", error);
  }
}


