import path from 'path'
import * as dotenv from 'dotenv'
import axios, { AxiosResponse } from 'axios'

dotenv.config({
  path: path.resolve(__dirname, '../../../../.env')
})

const URL_PLEMSI = process.env.URL_PLEMSI || ''

/** Fetches paginated support-document credit notes from Plemsi. */
export class GetCreditNoteSupportDocumentPlemsiService {
  /** Calls Plemsi GET /purchase/credit for the given page. */
  async run(apiKey: string, page: number): Promise<AxiosResponse> {
    try {
      const url = `${URL_PLEMSI}/purchase/credit?page=${page}&perPage=100`

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      })

      return response
    } catch (error) {
      console.log('Error in GetCreditNoteSupportDocumentPlemsiService', error)
      throw error
    }
  }
}
