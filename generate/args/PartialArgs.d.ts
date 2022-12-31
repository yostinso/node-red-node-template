
export type PartialPlus<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>

export type FieldsOfArgs<T> = {
    [K in keyof T]: T[K] extends (string|undefined) ? T[K] : never
}

export type PartialArgs<T> = Partial<FieldsOfArgs<T>>

export type PartialArgsPlus<T, K extends keyof PartialArgs<T>> = PartialPlus<PartialArgs<T>, K>
