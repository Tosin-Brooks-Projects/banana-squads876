import { Navbar1 } from "@/components/ui/navbar-1"

const NavbarDemo = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar1 />
            <div className="max-w-7xl mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Navbar Integration Demo</h1>
                <p className="text-lg text-gray-600">
                    This page demonstrates the newly integrated premium navbar component.
                    The navbar features smooth animations, responsive mobile menu, and a modern design.
                </p>
            </div>
        </div>
    )
}

export { NavbarDemo }
