import {  createClient } from "@wix/sdk";
import { functions } from "@wix/http-functions";

import { dashboard } from "@wix/dashboard";

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
    const response = await client.functions.post("newSendEmail", {
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
    console.log("Email sent successfully:", data);
    // Handle member data.
  } catch (error) {
    // Handle error.
    console.error("Error sending email:", error);
  }
}


