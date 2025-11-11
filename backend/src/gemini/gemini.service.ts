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
    // Usar modelo estable disponible
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async parseTransaction(userInput: string): Promise<ParsedTransaction> {
    const prompt = `
Eres un asistente que ayuda a clasificar transacciones financieras en español.

Contexto:
- La moneda es COP (pesos colombianos)
- Fecha actual: ${new Date().toISOString().split('T')[0]}

Categorías válidas y sus descripciones OBLIGATORIAS (DEBES elegir UNA descripción de la lista correspondiente):
[
  {
    "categoria": "Necesidad",
    "descripciones": [
      "Alimentacion necesaria",
      "Aseo (casa o personal)",
      "Medicina",
      "Vivienda",
      "Pago de servicios",
      "Transporte",
      "No alimentarios",
      "Impuesto",
      "Cargos / tarifas",
      "Ropa",
      "Gasolina",
      "Dinero a mi madre",
      "Trabajo",
      "Parqueadero",
      "Peluqueada",
      "Otro"
    ]
  },
  {
    "categoria": "Lujo",
    "descripciones": [
      "Ropa",
      "Comida rica",
      "Actividad recreativa",
      "Dispositivo electrónico",
      "Regalos",
      "Membresias",
      "Ajuste de gastos",
      "Transporte",
      "Inversion personal",
      "Gym",
      "Otro"
    ]
  },
  {
    "categoria": "Ahorro",
    "descripciones": [
      "Valor ahorrado",
      "Otro"
    ]
  },
  {
    "categoria": "Entrada",
    "descripciones": [
      "Salario",
      "Dinero extra",
      "Rendimientos",
      "Otro"
    ]
  }
]

Tipos válidos: "Ingreso", "Egreso", "Ahorro"

Medios de pago válidos: "Efectivo", "NU", "Daviplata", "Nequi", "BBVA", "Bancolombia", "Davivienda", "Otro"

Reglas ESTRICTAS:
1. Si la categoría es "Entrada", el tipo debe ser "Ingreso"
2. Si la categoría es "Ahorro", el tipo debe ser "Ahorro"
3. Si la categoría es "Necesidad" o "Lujo", el tipo debe ser "Egreso"
4. Calcula fechas relativas (ayer, hoy, mañana) desde la fecha actual
5. Si no se menciona el medio de pago, usa "Efectivo" por defecto
6. Extrae el monto numérico sin símbolos
7. **IMPORTANTE**: El campo "descripcion" DEBE ser EXACTAMENTE uno de los valores de la lista de descripciones de la categoría elegida. Analiza el contexto del gasto y elige la descripción MÁS APROPIADA de la lista. NUNCA dejes la descripción vacía. Si no estás seguro, usa "Otro".

8. **OBSERVACIONES DESCRIPTIVAS**: El campo "observaciones" debe ser una descripción detallada y útil que incluya:
   - **¿Qué es el gasto/ingreso?** (ej: "Helado de chocolate en la heladería del centro")
   - **¿De dónde viene o dónde se hizo?** (ej: "Restaurante El Buen Sabor", "Transferencia desde cuenta de ahorros")
   - **¿En qué lugar?** (ej: "Supermercado Éxito Calle 100", "Cajero BBVA")
   - **Contexto adicional** si está disponible (ej: "Pago mensual", "Compra de emergencia", "Regalo de cumpleaños")
   - Si NO hay información adicional disponible en el texto del usuario, usa null en lugar de una observación genérica o vacía.
   - Las observaciones deben ser informativas y específicas, no genéricas como "Gasto realizado" o "Transacción".

Ejemplos:
- "Ayer gasté 2500 en helado" → categoria: "Lujo", descripcion: "Comida rica", observaciones: "Helado comprado ayer"
- "Pagué 50000 de luz en el Éxito" → categoria: "Necesidad", descripcion: "Pago de servicios", observaciones: "Pago de servicio de luz en Supermercado Éxito"
- "Compré una camisa de 80000 en Zara" → categoria: "Lujo", descripcion: "Ropa", observaciones: "Camisa comprada en tienda Zara"
- "Recibí 500000 de salario" → categoria: "Entrada", descripcion: "Salario", observaciones: null (no hay información adicional útil)

Entrada del usuario: "${userInput}"

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin comillas triples), siguiendo este formato exacto:
{
  "categoria": "string",
  "descripcion": "string (OBLIGATORIO, debe ser uno de la lista segun su categoría)",
  "tipo": "string",
  "monto": number,
  "medio": "string",
  "fecha": "YYYY-MM-DD",
  "observaciones": "string descriptiva con detalles (qué, dónde, contexto) o null si no hay información adicional"
}
`;

    try {
      console.log('🔵 Enviando a Gemini:', userInput);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('🟢 Respuesta raw de Gemini:', text);
      
      // Limpiar respuesta de posibles markdown
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      console.log('🟡 Texto limpio:', cleanText);
      
      const parsed = JSON.parse(cleanText);
      
      console.log('🟣 JSON parseado:', JSON.stringify(parsed, null, 2));
      
      // Validar que los campos requeridos existen
      if (!parsed.categoria || !parsed.descripcion || !parsed.tipo || 
          !parsed.monto || !parsed.medio || !parsed.fecha) {
        console.error('❌ Campos faltantes:', {
          categoria: parsed.categoria,
          descripcion: parsed.descripcion,
          tipo: parsed.tipo,
          monto: parsed.monto,
          medio: parsed.medio,
          fecha: parsed.fecha
        });
        throw new Error('Respuesta de Gemini incompleta');
      }

      console.log('✅ Transacción válida, devolviendo:', parsed);
      return parsed;
    } catch (error) {
      console.error('❌ Error parsing Gemini response:', error);
      throw new Error(`Error al procesar con Gemini: ${error.message}`);
    }
  }
}
