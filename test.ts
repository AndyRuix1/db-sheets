import { SheetManager } from './src';


const mySheet = new SheetManager({
    client_email: 'spappco-automation-service@colbuddytesting.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwaHl96iJn+BDr\norwGmB9En/3DRXl7irAbM2p5bVIEAwAyw72T9xk01lX4J5iNeP2ReX5hukmMW04d\nT0sYvqU7t1l26Coo7e0asdU978zAvtcTUmKdkDHN/NyK+ClrqEI33FrtfbdEhdJN\nUSv8xauYLUDrlwkzMq0Me/ubE0Ve/+t5IzG5nKcjV9OFyRBztNwTkjDk27PThLg9\nQYIB2OqXpRQp1sOr+fOevG635KIkJ7ECLKfUDjLiPSIElZRzXhpIy9J+D63hB0OA\ncYNgmTNlekokE/LPeYT2+RnqI13XIs7UAxsrXBQ6EjEPVBsQIRoPT9SekSvzJRj4\ndKTfFjvrAgMBAAECggEAGCT3JT/eSABLVzz1jX9/nsBjwTi+jk/77NUmMwq+iXRc\nWsEGBFJIcxNiPoMziCrG+y9iQqpLtmKpd9h/okThpPaMz6SqCeJlVocqylM1C9fI\nOcmdBrdoIasvXPPnPhK68XNUR0yywIsCWXkNKLJosHzXywbn3Z0yKH3Fq5gWdrsc\nd5A8X7WfHNDMFmRFY0l2AD5bOgyZNb2iycCPfHAA5zcW/yh74J1d8WtypqgRGi7p\nss3tSNee6OR5p7HH81auDHJCcSuzYRAT87a8MU22+B3ydi8pIK4SEqS8aIr9WCPK\nFvQgX5bqpSLryIeOckcbCqKKV1/Rbal87849TIA+mQKBgQD22ls7CPoOga55hDKX\nk7Yt63yiZQq6uCfbQcAAK+z0wPdRzgkXtRWXSz90QQq2xBu4Bqabg/jofpqpxZo8\ns4wzXg81vrVSl2f5jaCUmZ5/TZOcZ6NgUZcW6ZofwGFF+yZOC1jLGE9n5zMADsv2\n4E828aekGm6HzsrLNRZ/T6rcWQKBgQC28eEdL/jCVcuEUPdz9uShFYmGg/gYGyTB\n3ibmWWRbRf14bsJkgu5tzHt6XlflyKB1645+UW/QByJ68WbwiQw44WoVDjb3JuA4\n0OyXO/B2zbQ2dpbOnHu8QWoiiN75aHigf85EzLaxsn+TKF01TSN6nm/ng1Ou+AIx\nYFtrDGyB4wKBgDCONOHA20bdNU+LtFPiZzRTHLnovBqMPLLBFR4zhbGC/2Lk7x7t\nrKiM0Zdxb8URgA5LqJvwcpZwyMVaLAOCobI87yr4LzxmsboBpLN2IBoUTVO3gwhg\nJCMKohlawwd75kX1r2qLhpr+fCanwnD2ID7De+EondMy1urvr1QtfINJAoGBALNe\ndFkpr7zaYbBZskUAzSki9LPusFDyTBfIuFshSkQzW1G5Rt9FgIAm/On9ljC1hJ4Z\nVpyDPB264ROpnEQ6GsGqQVhjl4C7nRwXu+CL5DiXdxnvK+1nf+oUOPujNvtScvLq\nXFMYZAfV+z9NVBXui9qtfQqAuIvUnlHLJ9bNV5YBAoGAKAzuUbNP6uX2fpKrzaKx\nVwCG2NIN5iTZwqf317D2qCMEyrvOEcsmot1WhVzVJtOOyfz3CItsRictlIQL8LIQ\nbbjNXHqCwwp+BZVFHHQRVrdTlMvRm72jpouamBqxnsbqqBpXlGTZ2ZpmDlK3WKqf\nYeyh3B9c8bbyyAlwk98D8YY=\n-----END PRIVATE KEY-----\n',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
})
    .setTableInitPosition('A:3')
    .setSheetInfo('1MsjJuwYgoCswNF3k-0jxMxlZHQrANTLneJAQrg_Rt30', 'cities');


type TCities = {
    id: string;
    name: string;
    logistics: string;
    therapistAvailable: string;
}
const main = async () => {
    const modifiedCities = await mySheet.deleteRowsByFilter<TCities>({ filter: t => t.id === 'BOG' });
    console.log({ modifiedCities });
}

main();