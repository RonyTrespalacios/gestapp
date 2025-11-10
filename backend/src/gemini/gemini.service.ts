import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ParsedTransaction {
  categoria: string;
  descripcion: string;
  tipo: string;
  monto: number;
  medio: string;
  fecha: string;
  observaciones?: string;
}

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  async parseTransaction(userInput: string): Promise<ParsedTransaction> {
    const prompt = `
Eres un asistente que ayuda a clasificar transacciones financieras en español.

Contexto:
- La moneda es COP (pesos colombianos)
- Fecha actual: ${new Date().toISOString().split('T')[0]}

Categorías válidas y sus descripciones:
{
  "Necesidad": ["Alimentacion necesaria", "Aseo (casa o personal)", "Medicina", "Vivienda", "Pago de servicios", "Transporte", "No alimentarios", "Impuesto", "Cargos / tarifas", "Ropa", "Gasolina", "Dinero a mi madre", "Trabajo", "Parqueadero", "Peluqueada", "Otro"],
  "Lujo": ["Ropa", "Comida rica", "Actividad recreativa", "Dispositivo electrónico", "Regalos", "Membresias", "Ajuste de gastos", "Transporte", "Inversion personal", "Gym", "Otro"],
  "Ahorro": ["Valor ahorrado", "Otro"],
  "Entrada": ["Salario", "Dinero extra", "Rendimientos", "Otro"]
}

Tipos válidos: "Ingreso", "Egreso", "Ahorro"

Medios de pago válidos: "Efectivo", "NU", "Daviplata", "Nequi", "BBVA", "Bancolombia", "Davivienda", "Otro"

Reglas:
1. Si la categoría es "Entrada", el tipo debe ser "Ingreso"
2. Si la categoría es "Ahorro", el tipo debe ser "Ahorro"
3. Si la categoría es "Necesidad" o "Lujo", el tipo debe ser "Egreso"
4. Calcula fechas relativas (ayer, hoy, mañana) desde la fecha actual
5. Si no se menciona el medio de pago, usa "Efectivo" por defecto
6. Extrae el monto numérico sin símbolos

Entrada del usuario: "${userInput}"

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin comillas triples), siguiendo este formato exacto:
{
  "categoria": "string",
  "descripcion": "string",
  "tipo": "string",
  "monto": number,
  "medio": "string",
  "fecha": "YYYY-MM-DD",
  "observaciones": "string o null"
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Limpiar respuesta de posibles markdown
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanText);
      
      // Validar que los campos requeridos existen
      if (!parsed.categoria || !parsed.descripcion || !parsed.tipo || 
          !parsed.monto || !parsed.medio || !parsed.fecha) {
        throw new Error('Respuesta de Gemini incompleta');
      }

      return parsed;
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error(`Error al procesar con Gemini: ${error.message}`);
    }
  }
}
