import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import nodemailer from 'nodemailer'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailData {
  firstName: string
  lastName: string
  email: string
  church: string
  sector: string
  paymentAmount: number
  qrData: string
  receivesTshirt?: boolean
  tshirtSize?: string
  isResend?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    })
  }

  try {
    // Configuración de SMTP desde variables de entorno
    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com';
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');
    const smtpFrom = Deno.env.get('SMTP_FROM') || smtpUser;

    if (!smtpUser || !smtpPass) {
      throw new Error('Variables de entorno SMTP (SMTP_USER/SMTP_PASS) no están configuradas');
    }

    const body = await req.json() as EmailData;

    // Crear el transportador de nodemailer
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true para 465, false para otros puertos
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        // No fallar en certificados autofirmados
        rejectUnauthorized: false
      }
    });

    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(body.qrData)}`;

    const tshirtMessage = body.receivesTshirt
      ? `
        <div style="background-color: #dbeafe; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="color: #1e40af; margin-top: 0;">¡FELICITACIONES! 🎉</h3>
          <p style="margin-bottom: 0;">Por ser uno de los primeros 100 registrados, <strong>has ganado una camiseta exclusiva talla ${body.tshirtSize || 'seleccionada'}</strong>. ¡No olvides recogerla durante el evento!</p>
        </div>
      `
      : '';

    const subject = body.isResend
      ? '🔁 Reenvío de Confirmación - Nuevo QR para tu registro a Campamento Varones AAFCJ'
      : '✅ Confirmación de Registro - Campamento Varones AAFCJ';

    const headerTitle = body.isResend
      ? '🔁 Nuevo Código QR Generado'
      : '✅ ¡Registro Completado!';

    const introMessage = body.isResend
      ? 'Te enviamos nuevamente tu correo de confirmación con un nuevo código QR actualizado para tu ingreso al evento de Varones AAFCJ.'
      : 'Gracias por registrarte al evento de Varones AAFCJ. Tu registro ha sido procesado exitosamente.';

    const resendNote = body.isResend
      ? `<p style="color: #ef4444; font-size: 14px; margin-top: 10px;"><strong>Nota:</strong> Este QR reemplaza al anterior. Por favor, usa este nuevo código para ingresar al evento.</p>`
      : '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <h1 style="color: #2563eb; text-align: center; margin-bottom: 20px;">${headerTitle}</h1>

        <p style="margin-bottom: 20px;">Hola <strong>${body.firstName}</strong>,</p>

        <p style="margin-bottom: 20px;">${introMessage}</p>

        ${resendNote}

        ${tshirtMessage}

        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #2563eb; font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Detalles del Registro:</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0;"><strong>Nombre:</strong></td>
              <td style="padding: 5px 0;">${body.firstName} ${body.lastName}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Iglesia:</strong></td>
              <td style="padding: 5px 0;">${body.church}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;"><strong>Sector:</strong></td>
              <td style="padding: 5px 0;">${body.sector}</td>
            </tr>
            ${body.receivesTshirt && body.tshirtSize ? `
            <tr>
              <td style="padding: 5px 0;"><strong>Talla de Camiseta:</strong></td>
              <td style="padding: 5px 0;">${body.tshirtSize}</td>
            </tr>` : ''}
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
          <h3 style="color: #2563eb; margin-bottom: 15px;">Tu Código QR de Acceso</h3>
          <div style="background-color: white; padding: 15px; border-radius: 8px; display: inline-block; border: 1px solid #e2e8f0;">
            <img src="${qrImageUrl}" alt="Código QR" width="200" height="200" style="display: block; margin: 0 auto;" />
          </div>
          <p style="font-size: 14px; color: #64748b; margin-top: 15px;">Presenta este código QR (digital o impreso) al ingresar al evento</p>
        </div>

        <p style="margin-bottom: 20px; text-align: center; color: #64748b; font-size: 14px;">
          Si tienes alguna pregunta, no dudes en contactarnos respondiendo a este correo.
        </p>

        <div style="margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; color: #94a3b8; font-size: 12px;">
          <p>
            <strong>Directiva de Varones AAFCJ</strong><br>
            Varones AAFCJ 2026
          </p>
        </div>
      </div>
    `;

    // Enviar el correo
    const info = await transporter.sendMail({
      from: smtpFrom,
      to: body.email,
      subject: subject,
      html: html,
    });

    console.log('Correo enviado: %s', info.messageId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Correo enviado correctamente',
        details: {
          id: info.messageId,
          to: body.email
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (err) {
    console.error('Error enviando correo:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        code: 'EMAIL_ERROR'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
