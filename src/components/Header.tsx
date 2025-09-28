import React from "react";
import { useNavigate } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";

const navigation = [
  { name: "Funcionalidades", href: "#features", current: false },
  { name: "Como Funciona", href: "#howitworks", current: false },
  { name: "Preços", href: "#pricing", current: false },
  { name: "FAQ", href: "#faq", current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Header() {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <Disclosure as="nav" className="bg-white dark:bg-gray-900 shadow-md">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              {/* Logo */}
              <div className="flex items-center">
                <span className="text-2xl font-extrabold animate-gradient-text">
                  Do Seu Jeito
                </span>
              </div>

              {/* Desktop Menu */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8 items-center">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={classNames(
                      item.current
                        ? "border-indigo-500 text-gray-900 dark:text-gray-100"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300",
                      "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
                    )}
                  >
                    {item.name}
                  </a>
                ))}

                {/* Botão Entrar */}
                <button
                  onClick={handleLoginClick}
                  className="animate-gradient-button font-medium"
                >
                  Entrar
                </button>
              </div>

              {/* Mobile Menu Button */}
              <div className="flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <span className="sr-only">Abrir menu</span>
                  {open ? (
                    <XIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pt-2 pb-3">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    item.current
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300",
                    "block border-l-4 py-2 pl-3 pr-4 text-base font-medium"
                  )}
                >
                  {item.name}
                </a>
              ))}
            </div>
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={handleLoginClick}
                className="w-full animate-gradient-button font-medium"
              >
                Entrar
              </button>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
