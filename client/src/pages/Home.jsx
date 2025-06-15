import { Link } from 'react-router-dom'

export default function Home() {
    return (
        <div className="bg-white">
            {/* Hero section */}
            <div className="relative isolate px-6 pt-14 lg:px-8">
                <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                            Start Your Athletic Journey Today
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600">
                            Connect with expert coaches, find the perfect starter kit, and get personalized guidance for your sports journey. Whether you're a parent or a young athlete, we're here to help you succeed.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                to="/starter-kits"
                                className="btn btn-primary"
                            >
                                Browse Starter Kits
                            </Link>
                            <Link
                                to="/coaches"
                                className="btn btn-secondary"
                            >
                                Find a Coach
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature section */}
            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-primary-600">Get Started Faster</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Everything you need to begin your sports journey
                    </p>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        From equipment recommendations to expert coaching, we provide all the resources you need to start your athletic journey with confidence.
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                        {features.map((feature) => (
                            <div key={feature.name} className="flex flex-col">
                                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                                    {feature.name}
                                </dt>
                                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                                    <p className="flex-auto">{feature.description}</p>
                                    <p className="mt-6">
                                        <Link to={feature.href} className="text-sm font-semibold leading-6 text-primary-600">
                                            Learn more <span aria-hidden="true">→</span>
                                        </Link>
                                    </p>
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    )
}

const features = [
    {
        name: 'Starter Kits',
        description: "Get personalized equipment recommendations based on your sport, age, and skill level. We'll help you find the perfect gear to start your journey.",
        href: '/starter-kits',
    },
    {
        name: 'Expert Coaches',
        description: 'Connect with experienced coaches who can provide personalized guidance and help you develop your skills in your chosen sport.',
        href: '/coaches',
    },
    {
        name: 'Ask Questions',
        description: 'Get answers to your sports-related questions from our community of experts, coaches, and experienced athletes.',
        href: '/ask',
    },
] 