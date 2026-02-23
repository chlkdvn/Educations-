import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ShoppingBag, BookOpen, ArrowRight } from 'lucide-react';

const PaymentStatus = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const status = searchParams.get('status');
    const courseId = searchParams.get('courseId');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    const isSuccess = status === 'success';
    const isCourse = !!courseId;
    const isOrder = !!orderId;

    // Redirect home if no valid status
    useEffect(() => {
        if (!status) {
            navigate('/');
        }
    }, [status, navigate]);

    if (!status) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-12">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Illustration */}
                    <div className="relative h-96 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center overflow-hidden">
                        {isSuccess ? (
                            <>
                                {/* Success Illustrations */}
                                <img
                                    src="https://thumbs.dreamstime.com/b/celebrating-stick-figure-green-check-mark-white-background-under-confetti-large-reinforces-feeling-accomplishment-421143727.jpg"
                                    alt="Success celebration"
                                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                                />
                                <img
                                    src="https://thumbs.dreamstime.com/b/three-green-checkmarks-celebration-image-featuring-each-surrounded-colorful-confetti-central-checkmark-427950303.jpg"
                                    alt="Green checkmarks with confetti"
                                    className="relative z-10 w-64 h-64 object-contain drop-shadow-2xl"
                                />
                                {isCourse && (
                                    <img
                                        src="https://39833184.fs1.hubspotusercontent-na1.net/hubfs/39833184/online%20driver%20course%20cartoon.jpg"
                                        alt="Learning online"
                                        className="absolute bottom-0 right-0 w-48 h-48 object-contain opacity-70"
                                    />
                                )}
                                {isOrder && (
                                    <img
                                        src="https://thumbs.dreamstime.com/b/delivery-concept-young-man-using-mobile-phone-shopping-online-woman-doing-online-shopping-happy-customer-sitting-shopping-198465586.jpg"
                                        alt="Happy shopping"
                                        className="absolute bottom-0 right-0 w-48 h-48 object-contain opacity-70"
                                    />
                                )}
                            </>
                        ) : (
                            <>
                                {/* Failed Illustrations */}
                                <img
                                    src="https://static.vecteezy.com/system/resources/thumbnails/066/941/924/small/flat-illustration-of-frustrated-man-facing-system-error-on-laptop-and-desktop-screens-while-working-from-home-red-cross-error-icon-indicating-failure-technical-issue-or-connection-problem-vector.jpg"
                                    alt="Payment failed"
                                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                                />
                                <img
                                    src="https://www.shutterstock.com/image-vector/payment-error-failed-try-again-260nw-2282301015.jpg"
                                    alt="Payment error"
                                    className="relative z-10 w-72 h-72 object-contain drop-shadow-2xl"
                                />
                            </>
                        )}

                        {/* Icon Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            {isSuccess ? (
                                <CheckCircle className="w-32 h-32 text-green-500 drop-shadow-2xl" />
                            ) : (
                                <XCircle className="w-32 h-32 text-red-500 drop-shadow-2xl" />
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 sm:p-12 text-center">
                        {isSuccess ? (
                            <>
                                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                                    Payment Successful! 🎉
                                </h1>
                                <p className="text-xl text-gray-600 mb-6">
                                    {isCourse && "You've successfully enrolled in the course!"}
                                    {isOrder && "Your order has been placed successfully!"}
                                    {!isCourse && !isOrder && "Transaction completed successfully!"}
                                </p>
                                {amount && (
                                    <p className="text-2xl font-semibold text-green-600 mb-8">
                                        Amount: ₦{parseFloat(amount).toLocaleString()}
                                    </p>
                                )}
                            </>
                        ) : (
                            <>
                                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                                    Payment Failed 😔
                                </h1>
                                <p className="text-xl text-gray-600 mb-6">
                                    Something went wrong with your payment. Please try again or contact support.
                                </p>
                            </>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                            {isSuccess && isCourse && (
                                <button
                                    onClick={() => navigate('/My-enrollments')}
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                                >
                                    <BookOpen className="w-6 h-6" />
                                    Go to My Courses
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            )}

                            {isSuccess && isOrder && (
                                <button
                                    onClick={() => navigate('/My-enrollments')} // or /my-enrollments if you use that
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                                >
                                    <ShoppingBag className="w-6 h-6" />
                                    View My Orders
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            )}

                            <button
                                onClick={() => navigate('/')}
                                className="px-8 py-4 bg-gray-100 text-gray-800 font-bold text-lg rounded-xl hover:bg-gray-200 transition-all"
                            >
                                Back to Home
                            </button>

                            {!isSuccess && (
                                <button
                                    onClick={() => window.history.back()}
                                    className="px-8 py-4 bg-red-100 text-red-700 font-bold text-lg rounded-xl hover:bg-red-200 transition-all"
                                >
                                    Try Again
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Support note */}
                {!isSuccess && (
                    <p className="text-center text-gray-500 mt-8">
                        Need help? Contact support at support@yourapp.com
                    </p>
                )}
            </div>
        </div>
    );
};

export default PaymentStatus;