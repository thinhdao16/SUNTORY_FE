import { useRef, useEffect } from "react";
import { useForm } from "react-hook-form";

export function useHealthFormSync<T extends object>(
    zustandData: T,
    setZustandData: (data: Partial<T>) => void,
    deps: any[] = []
) {
    const form = useForm<T>({ defaultValues: zustandData as import("react-hook-form").DefaultValues<T> });
    const prevValues = useRef<T>(zustandData);

    useEffect(() => {
        const subscription = form.watch((value) => {
            const prev = prevValues.current;
            if (JSON.stringify(prev) !== JSON.stringify(value)) {
                prevValues.current = value as T;
                setZustandData({ ...value });
            }
        });
        return () => {
            subscription.unsubscribe();
        };
    }, [form.watch, setZustandData]);

    useEffect(() => {
        form.reset(zustandData);
    }, [form.reset, ...deps]);

    return form;
}