const sendEmail = async (email, subject, message) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'ACM JIT',
          email: process.env.EMAIL_USER,
        },
        to: [{ email }],
        subject,
        htmlContent: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("�━�━�━ BREVO EMAIL FAILED � ━�━�━");
      console.error(JSON.stringify(data, null, 2));
      // Generic error to avoid leaking internal API details
      throw new Error('Failed to send email');
    }

    return data;
  } catch (err) {
    console.error("�━�━�━ EMAIL SEND EXCEPTION � ━�━�━");
    console.error(err);
    // Generic error for any unexpected errors
    throw new Error('Failed to send email');
  }
};

export default sendEmail;