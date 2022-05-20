import type{ AxiosError } from 'axios'
import classnames from 'classnames'
import { ResultAsync } from 'neverthrow'
import { useMemo, useLayoutEffect, useCallback } from 'react'
import { Card } from '@components'
import EE, { Action } from '@lib/event'
import { isClashX, jsBridge } from '@lib/jsBridge'
import { Proxy as IProxy } from '@lib/request'
import { BaseComponentProps } from '@models'
import { useClient, useProxy } from '@stores'

import './style.scss'

interface ProxyProps extends BaseComponentProps {
    config: IProxy
}

const TagColors = {
    '#909399': 0,
    '#00c520': 200,
    '#ff9a28': 600,
    '#ff3e5e': Infinity,
}

export function Proxy (props: ProxyProps) {
    const { config, className } = props
    const { set } = useProxy()
    const client = useClient()

    const getDelay = useCallback(async (name: string) => {
        if (isClashX()) {
            const delay = await jsBridge?.getProxyDelay(name) ?? 0
            return delay
        }

        const { data: { delay } } = await client.getProxyDelay(name)
        return delay
    }, [client])

    const speedTest = useCallback(async function () {
        const result = await ResultAsync.fromPromise(getDelay(config.name), e => e as AxiosError)

        const validDelay = result.isErr() ? 0 : result.value
        set(draft => {
            const proxy = draft.proxies.find(p => p.name === config.name)
            if (proxy != null) {
                proxy.history.push({ time: Date.now().toString(), delay: validDelay })
            }
        })
    }, [config.name, getDelay, set])

    const delay = useMemo(
        () => config.history?.length ? config.history.slice(-1)[0].delay : 0,
        [config],
    )

    useLayoutEffect(() => {
        const handler = () => { speedTest() }
        EE.subscribe(Action.SPEED_NOTIFY, handler)
        return () => EE.unsubscribe(Action.SPEED_NOTIFY, handler)
    }, [speedTest])

    const hasError = useMemo(() => delay === 0, [delay])
    const color = useMemo(
        () => Object.keys(TagColors).find(
            threshold => delay <= TagColors[threshold as keyof typeof TagColors],
        ),
        [delay],
    )

    const backgroundColor = hasError ? undefined : color
    return (
        <div className={classnames('proxy-item', { 'proxy-error': hasError }, className)}>
            <span className="proxy-type" style={{ backgroundColor }}>{config.type}</span>
            <p className="proxy-name">{config.name}</p>
            <p className="proxy-delay" style={{ color }}>{delay === 0 ? '-' : `${delay}ms`}</p>
        </div>
    )
}
