export class DocumentQueryCriteria {
    keywords: string[];
    docFullTextSearch: boolean;
    pages: number[];
    documentSortMethod: DocumentSortMethod;
    contentBlockSortMethod: ContentBlockSortMethod;
    includeTypes: string[];
    includeConcatFields: string[];
    includeRootIds: string[];
    includeNotebookIds: string[];
    excludeNotebookIds: string[];

    constructor(
        keywords: string[],
        docFullTextSearch: boolean,
        pages: number[],
        documentSortMethod: DocumentSortMethod,
        contentBlockSortMethod: ContentBlockSortMethod,
        includeTypes: string[],
        includeConcatFields: string[],
        includeNotebookIds: string[],
        excludeNotebookIds: string[],
    ) {
        this.keywords = keywords;
        this.docFullTextSearch = docFullTextSearch;
        this.pages = pages;
        this.documentSortMethod = documentSortMethod;
        this.contentBlockSortMethod = contentBlockSortMethod;
        this.includeTypes = includeTypes;
        this.includeConcatFields = includeConcatFields;
        this.includeNotebookIds = includeNotebookIds;
        this.excludeNotebookIds = excludeNotebookIds;
    }
}



export function generateDocumentListSql(
    queryCriteria: DocumentQueryCriteria,
): string {

    let keywords = queryCriteria.keywords;
    let docFullTextSearch = queryCriteria.docFullTextSearch;
    let pages = queryCriteria.pages;
    let includeNotebookIds = queryCriteria.includeNotebookIds;
    let documentSortMethod = queryCriteria.documentSortMethod;
    let includeConcatFields = queryCriteria.includeConcatFields;
    let columns: string[] = [" * "];

    let contentParamSql = "";
    if (keywords && keywords.length > 0) {
        let concatConcatFieldSql = getConcatFieldSql("concatContent", includeConcatFields);
        columns.push(` ${concatConcatFieldSql} `);
        if (docFullTextSearch) {
            let documentIdSql = generateDocumentIdTableSql(queryCriteria);
            contentParamSql = ` AND id in (${documentIdSql}) `;
        } else {
            contentParamSql = " AND " + generateAndLikeConditions("concatContent", keywords);
        }
    }

    let boxInSql = " "
    if (includeNotebookIds && includeNotebookIds.length > 0) {
        boxInSql = generateAndInConditions("box", includeNotebookIds);
    }

    // let orders = [];

    // if (keywords && keywords.length > 0) {
    //     let orderCaseCombinationSql = generateRelevanceOrderSql("concatContent", keywords, false);
    //     orders = [orderCaseCombinationSql];
    // }

    // if (documentSortMethod == 'modifiedAsc') {
    //     orders.push([" updated ASC "]);
    // } else if (documentSortMethod == 'modifiedDesc') {
    //     orders.push([" updated DESC "]);
    // } else if (documentSortMethod == 'createdAsc') {
    //     orders.push([" created ASC "]);
    // } else if (documentSortMethod == 'createdDesc') {
    //     orders.push([" created DESC "]);
    // } else if (documentSortMethod == 'refCountAsc') {
    //     columns.push(" (SELECT count(1) FROM refs WHERE def_block_root_id = blocks.id) refCount ");
    //     orders.push([" refCount ASC ", " updated DESC "]);
    // } else if (documentSortMethod == 'refCountDesc') {
    //     columns.push(" (SELECT count(1) FROM refs WHERE def_block_root_id = blocks.id) refCount ");
    //     orders.push([" refCount DESC ", " updated DESC "]);
    // } else if (documentSortMethod == 'alphabeticAsc') {
    //     orders.push([" concatContent ASC ", " updated DESC "]);
    // } else if (documentSortMethod == 'alphabeticDesc') {
    //     orders.push([" concatContent DESC ", " updated DESC "]);
    // }

    let columnSql = columns.join(" , ");
    // let orderSql = generateOrderSql(orders);
    // let limitSql = generateLimitSql(pages);
    let orderSql = "";
    let limitSql = "LIMIT 99999999";
    /*
            * ,
        ${concatConcatFieldSql},
        (SELECT count(1) FROM refs WHERE def_block_root_id = blocks.id) refCount
    */

    let basicSql = `
    SELECT
      ${columnSql}

    FROM
        blocks 
    WHERE
        type = 'd' 
        ${contentParamSql}
        ${boxInSql}

    ${orderSql}
    ${limitSql}
    `

    return cleanSpaceText(basicSql);
}






function getConcatFieldSql(asFieldName: string, fields: string[]): string {
    if (!fields || fields.length <= 0) {
        return "";
    }
    // let sql = ` ( ${fields.join(" || ' '  || ")} ) `;
    let sql = ` ( ${fields.join(" || ")} ) `
    if (asFieldName) {
        sql += ` AS ${asFieldName} `;
    }

    return sql;
}



function generateAndLikeConditions(
    fieldName: string,
    params: string[],
): string {
    if (params.length === 0) {
        return " ";
    }

    const conditions = params.map(
        (param) => `${fieldName}  LIKE '%${param}%'`,
    );
    const result = conditions.join(" AND ");

    return result;
}



function generateAndInConditions(
    fieldName: string,
    params: string[],
): string {
    if (!params || params.length === 0) {
        return " ";
    }
    let result = ` AND ${fieldName} IN (`
    const conditions = params.map(
        (param) => ` '${param}' `,
    );
    result = result + conditions.join(" , ") + " ) ";

    return result;
}

function generateAndNotInConditions(
    fieldName: string,
    params: string[],
): string {
    if (!params || params.length === 0) {
        return " ";
    }
    let result = ` AND ${fieldName} NOT IN (`
    const conditions = params.map(
        (param) => ` '${param}' `,
    );
    result = result + conditions.join(" , ") + " ) ";

    return result;
}


function generateDocumentIdTableSql(
    queryCriteria: DocumentQueryCriteria
): string {
    let keywords = queryCriteria.keywords;
    let includeTypes = queryCriteria.includeTypes;
    let includeConcatFields = queryCriteria.includeConcatFields;
    let includeRootIds = queryCriteria.includeRootIds;
    let includeNotebookIds = queryCriteria.includeNotebookIds;
    let excludeNotebookIds = queryCriteria.excludeNotebookIds;

    let concatDocumentConcatFieldSql = getConcatFieldSql(null, includeConcatFields);
    let columns = ["root_id"]
    let contentLikeField = `GROUP_CONCAT( ${concatDocumentConcatFieldSql} )`;

    let orders = [];

    let documentIdContentTableSql = generateDocumentContentLikeSql(
        columns, keywords, contentLikeField, includeTypes, includeRootIds, includeNotebookIds, excludeNotebookIds, orders, null);

    return documentIdContentTableSql;
}


function generateDocumentContentLikeSql(
    columns: string[],
    keywords: string[],
    contentLikeField: string,
    includeTypes: string[],
    includeRootIds: string[],
    includeNotebookIds: string[],
    excludeNotebookIds: string[],
    orders: string[],
    pages: number[]): string {

    let columnSql = columns.join(",");
    let typeInSql = generateAndInConditions("type", includeTypes);
    let rootIdInSql = " ";
    let boxInSql = " ";
    let boxNotInSql = " ";
    // 如果文档id不为空，则忽略过滤的笔记本id。
    if (includeRootIds && includeRootIds.length > 0) {
        rootIdInSql = generateAndInConditions("root_id", includeRootIds);
    } else if (includeNotebookIds && includeNotebookIds.length > 0) {
        boxInSql = generateAndInConditions("box", includeNotebookIds);
    } else {
        boxNotInSql = generateAndNotInConditions("box", excludeNotebookIds);
    }

    // let contentOrLikeSql = generateOrLikeConditions("content", keywords);
    // if (contentOrLikeSql) {
    //     contentOrLikeSql = ` AND ( ${contentOrLikeSql} ) `;
    // }
    let aggregatedContentAndLikeSql = generateAndLikeConditions(
        ` ${contentLikeField} `,
        keywords,
    );
    if (aggregatedContentAndLikeSql) {
        aggregatedContentAndLikeSql = ` AND ( ${aggregatedContentAndLikeSql} ) `;
    }

    let orderSql = generateOrderSql(orders);

    let limitSql = generateLimitSql(pages);


    let sql = `  
        SELECT ${columnSql} 
        FROM
            blocks 
        WHERE
            1 = 1 
            ${typeInSql}
            ${rootIdInSql}
            ${boxInSql}
            ${boxNotInSql}
        GROUP BY
            root_id 
        HAVING
            1 = 1 
            ${aggregatedContentAndLikeSql}
        ${orderSql}
        ${limitSql}
    `;
    return sql;
}

function generateOrderSql(orders: string[]): string {
    let orderSql = '';
    if (orders) {
        orders = orders.filter((order) => order);
        let orderParam = orders.join(",");
        if (orderParam) {
            orderSql = ` ORDER BY ${orderParam} `;
        }
    }
    return orderSql;
}


function generateRelevanceOrderSql(columnName: string, keywords: string[], orderAsc: boolean): string {
    let subSql = "";

    for (let i = 0; i < keywords.length; i++) {
        let key = keywords[i];
        subSql += ` (${columnName} LIKE '%${key}%') `;
        if (i < keywords.length - 1) {
            subSql += ' + ';
        }
    }

    let orderSql = "";
    if (subSql) {
        let sortDirection = orderAsc ? " ASC " : " DESC ";
        orderSql = `( ${subSql} ) ${sortDirection}`;
    }
    return orderSql;
}


function cleanSpaceText(inputText: string): string {
    // 去除换行
    let cleanedText = inputText.replace(/[\r\n]+/g, ' ');

    // 将多个空格转为一个空格
    cleanedText = cleanedText.replace(/\s+/g, ' ');

    // 去除首尾空格
    cleanedText = cleanedText.trim();

    return cleanedText;
}



function generateLimitSql(pages: number[]): string {
    let limitSql = '';
    if (pages) {
        const limit = pages[1];
        if (pages.length == 1) {
            limitSql = ` LIMIT ${limit} `;
        } else if (pages.length == 2) {
            const offset = (pages[0] - 1) * pages[1];
            limitSql = ` LIMIT ${limit} OFFSET ${offset} `;
        }
    }
    return limitSql;
}