export enum RuleType {
    Domain = 'Domain',
    DomainSuffix = 'DomainSuffix',
    DomainKeyword = 'DomainKeyword',
    GeoIP = 'GeoIP',
    IPCIDR = 'IPCIDR',
    SrcIPCIDR = 'SrcIPCIDR',
    SrcPort = 'SrcPort',
    DstPort = 'DstPort',
    MATCH = 'MATCH',
    RuleSet = 'RuleSet',
}

export interface Rule {
    type?: RuleType

    payload?: string

    proxy?: string // proxy or proxy group name

    size?: number

    Size?: number
}
