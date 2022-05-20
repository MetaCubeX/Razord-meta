import { useMemo } from 'react'

import { Card, Header, Icon, Checkbox } from '@components'
import EE from '@lib/event'
import { useRound } from '@lib/hook'
import * as API from '@lib/request'
import { useI18n, useConfig, useProxy, useProxyProviders, useGeneral } from '@stores'

import { Proxy, Group, Provider } from './components'
import './style.scss'

enum sortType {
    None,
    Asc,
    Desc,
}

const sortMap = {
    [sortType.None]: 'sort',
    [sortType.Asc]: 'sort-ascending',
    [sortType.Desc]: 'sort-descending',
}

export function compareDesc (a: API.Proxy, b: API.Proxy) {
    const lastDelayA = (a.history.length > 0) ? a.history.slice(-1)[0].delay : 0
    const lastDelayB = (b.history.length > 0) ? b.history.slice(-1)[0].delay : 0
    return (lastDelayB || Number.MAX_SAFE_INTEGER) - (lastDelayA || Number.MAX_SAFE_INTEGER)
}

function ProxyGroups () {
    const { groups, global } = useProxy()
    const { data: config, set: setConfig } = useConfig()
    const { general } = useGeneral()
    const { translation } = useI18n()
    const { t } = translation('Proxies')

    const list = useMemo(
        () => general.mode === 'global' ? [global, ...groups] : groups,
        [general, groups, global],
    )

    return <>
        {
            list.length !== 0 &&
            <div className="flex flex-col">
                <Header title={t('groupTitle')}>
                    <Checkbox
                        className="cursor-pointer text-sm text-shadow-primary text-primary-600"
                        checked={config.breakConnections}
                        onChange={value => setConfig('breakConnections', value)}>
                        {t('breakConnectionsText')}
                    </Checkbox>
                </Header>
                <Card className="my-2.5 p-0 md:my-4">
                    <ul className="list-none divide-y divide-gray-300">
                        {
                            list.map(p => (
                                <li key={p.name}>
                                    <Group config={p} />
                                </li>
                            ))
                        }
                    </ul>
                </Card>
            </div>
        }
    </>
}

function ProxyProviders () {
    const { providers } = useProxyProviders()
    const { translation: useTranslation } = useI18n()
    const { t } = useTranslation('Proxies')

    return <>
        {
            providers.length !== 0 &&
            <div className="flex flex-col">
                <Header title={t('providerTitle')} />
                <ul className="list-none">
                    {
                        providers.map(p => (
                            <li className="my-2.5 md:my-4" key={p.name}>
                                <Provider provider={p} />
                            </li>
                        ))
                    }
                </ul>
            </div>
        }
    </>
}

function Proxies () {
    const { proxies } = useProxy()
    const { translation: useTranslation } = useI18n()
    const { t } = useTranslation('Proxies')

    function handleNotitySpeedTest () {
        EE.notifySpeedTest()
    }

    const { current: sort, next } = useRound(
        [sortType.Asc, sortType.Desc, sortType.None],
    )
    const sortedProxies = useMemo(() => {
        switch (sort) {
            case sortType.Desc:
                return proxies.slice().sort((a, b) => compareDesc(a, b))
            case sortType.Asc:
                return proxies.slice().sort((a, b) => -1 * compareDesc(a, b))
            default:
                return proxies.slice()
        }
    }, [sort, proxies])
    const handleSort = next

    return <>
        {
            sortedProxies.length !== 0 &&
            <div className="flex flex-col">
                <Header title={t('title')}>
                    <Icon className="ml-3" type={sortMap[sort]} onClick={handleSort} size={20} />
                    <Icon className="ml-3" type="speed" size={20} />
                    <span className="proxies-speed-test" onClick={handleNotitySpeedTest}>{t('speedTestText')}</span>
                </Header>
                <Card className="proxy-provider">
                    <ul className="proxies-list">
                        {
                            sortedProxies.map(p => (
                                <li key={p.name}>
                                    <Proxy config={p} />
                                </li>
                            ))
                        }
                    </ul>
                </Card>
            </div>
        }
    </>
}

export default function ProxyContainer () {
    return (
        <div className="page">
            <ProxyGroups />
            <ProxyProviders />
            <Proxies />
        </div>
    )
}
