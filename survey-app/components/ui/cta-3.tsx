import { ArrowRightIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CallToAction() {
    return (
        <div className="relative mx-auto flex w-full max-w-3xl flex-col justify-between gap-y-6 border-y bg-white/50 backdrop-blur-sm px-4 py-12 md:py-16">
            <PlusIcon
                className="absolute top-[-12px] left-[-12px] z-10 size-6 text-neutral-300"
                strokeWidth={1}
            />
            <PlusIcon
                className="absolute top-[-12px] right-[-12px] z-10 size-6 text-neutral-300"
                strokeWidth={1}
            />
            <PlusIcon
                className="absolute bottom-[-12px] left-[-12px] z-10 size-6 text-neutral-300"
                strokeWidth={1}
            />
            <PlusIcon
                className="absolute right-[-12px] bottom-[-12px] z-10 size-6 text-neutral-300"
                strokeWidth={1}
            />

            <div className="-inset-y-6 pointer-events-none absolute left-0 w-px border-l border-neutral-200" />
            <div className="-inset-y-6 pointer-events-none absolute right-0 w-px border-r border-neutral-200" />

            <div className="-z-10 absolute top-0 left-1/2 h-full border-l border-dashed border-neutral-200" />

            <div className="space-y-4 relative z-20">
                <h2 className="text-center font-bold text-3xl md:text-4xl text-neutral-900">
                    Make surveys <span className="text-orange-600">engaging</span> again.
                </h2>
                <p className="text-center text-neutral-600 max-w-lg mx-auto text-lg">
                    Start your free trial today. Join 10,000+ creators building experiences that people actually finish.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-neutral-200 hover:bg-neutral-50 text-neutral-600">
                    Contact Sales
                </Button>
                <Button size="lg" className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                    Get Started <ArrowRightIcon className="size-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
