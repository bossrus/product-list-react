export type TItem = {
	id: string;
	product: string;
	price: number;
	brand: string;
};

export type TParams = {
	[key: string]: string[] | string | number | Record<string, string> | Record<string, string[]>
}

export type TData = {
	action?: string,
	params?: TParams
}

type TFetchResult = {
	loadsByFiltersLocal?: boolean,
	err: string
}

export type TFetchDataResult = TFetchResult & {
	body: TItem[],
}
export type TFetchIDsOrBrandsResult = TFetchResult & {
	body: string[],
	canLoadMore?: boolean
}