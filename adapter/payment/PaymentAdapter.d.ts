import PaymentMethod from "../../models/PaymentMethod";
import Payment from "../../modelsHelp/Payment";
/**
 * Абстрактный класс Payment адаптера. Используется для создания новых адаптеров платежных систем.
 */
/**
 *
 *
 */
export default abstract class PaymentAdapter {
    protected constructor(paymentMethod: PaymentMethod);
    /**
     * Создание Оплаты
     * @param Payment - Платежный документ
     * @return Результат работы функции, тело ответа и код результата
     */
    abstract createPayment(payment: Payment, backLink: string): Promise<{
        redirectLink: string;
        payment: Payment;
        error?: any;
    }>;
    /**
     * Проверка Оплаты
     * @param Payment - Платежный документ
     * @return результат работы функции, тело ответа и код результата
     */
    abstract checkPayment(payment: Payment): Promise<{
        paid: boolean;
        payment: Payment;
        error?: any;
    }>;
    /**
     * Метод для создания и получения уже существующего Payment адаптера
     * @param params - параметры для инициализации
     */
    static getInstance(...params: any[]): PaymentAdapter;
}
