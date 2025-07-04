import { Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Starter Kits', href: '/starter-kits' },
    { name: 'Coaches', href: '/coaches' },
    { name: 'Teams', href: '/teams' },
    { name: 'Leagues', href: '/leagues' },
    { name: 'Ask a Question', href: '/ask' },
]

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function Navbar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            alert('Failed to log out');
        }
    };

    return (
        <Disclosure as="nav" className="bg-white shadow">
            {({ open }) => (
                <>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 justify-between">
                            <div className="flex">
                                <div className="flex flex-shrink-0 items-center">
                                    <Link to="/" className="text-2xl font-bold text-primary-600">
                                        NextAthlete
                                    </Link>
                                </div>
                                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                    {navigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-primary-500 hover:text-gray-700"
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:items-center">
                                {currentUser ? (
                                    <>
                                        <Link
                                            to="/inbox"
                                            className="btn btn-secondary mr-2 flex items-center justify-center w-10 h-10 rounded-full p-0"
                                            title="Inbox"
                                        >
                                            <EnvelopeIcon className="h-6 w-6 text-gray-500 group-hover:text-primary-600 transition" />
                                        </Link>
                                        <Link
                                            to="/profile"
                                            className="btn btn-secondary mr-2"
                                        >
                                            View Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="btn btn-primary"
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/login"
                                            className="btn btn-secondary mr-2"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            to="/register"
                                            className="btn btn-primary"
                                        >
                                            Register
                                        </Link>
                                    </>
                                )}
                            </div>
                            <div className="-mr-2 flex items-center sm:hidden">
                                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                                    <span className="sr-only">Open main menu</span>
                                    {open ? (
                                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                                    ) : (
                                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                                    )}
                                </Disclosure.Button>
                            </div>
                        </div>
                    </div>

                    <Disclosure.Panel className="sm:hidden">
                        <div className="space-y-1 pb-3 pt-2">
                            {navigation.map((item) => (
                                <Disclosure.Button
                                    key={item.name}
                                    as={Link}
                                    to={item.href}
                                    className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-primary-500 hover:bg-gray-50 hover:text-gray-700"
                                >
                                    {item.name}
                                </Disclosure.Button>
                            ))}
                            {currentUser && (
                                <Disclosure.Button
                                    as={Link}
                                    to="/inbox"
                                    className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-primary-500 hover:bg-gray-50 hover:text-gray-700"
                                >
                                    Inbox
                                </Disclosure.Button>
                            )}
                        </div>
                        <div className="border-t border-gray-200 pb-3 pt-4">
                            <div className="space-y-1">
                                {currentUser ? (
                                    <>
                                        <Disclosure.Button
                                            as={Link}
                                            to="/profile"
                                            className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                        >
                                            View Profile
                                        </Disclosure.Button>
                                        <Disclosure.Button
                                            as="button"
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                        >
                                            Logout
                                        </Disclosure.Button>
                                    </>
                                ) : (
                                    <>
                                        <Disclosure.Button
                                            as={Link}
                                            to="/login"
                                            className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                        >
                                            Login
                                        </Disclosure.Button>
                                        <Disclosure.Button
                                            as={Link}
                                            to="/register"
                                            className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                        >
                                            Register
                                        </Disclosure.Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    )
} 