import { atom, useAtom, useAtomValue } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useLocation } from 'react-router-dom'

import { isClashX, jsBridge } from '@lib/jsBridge'
import { Client } from '@lib/request'

const clashxConfigAtom = atom(async () => {
    if (!isClashX()) {
        return null
    }

    const info = await jsBridge!.getAPIInfo()
    return {
        hostname: info.host,
        port: info.port,
        secret: info.secret,
        protocol: 'http:',
    }
})

export const localStorageAtom = atomWithStorage<Array<{
    hostname: string
    port: string
    secret: string
    protocol: 'http' | 'https'
}>>('externalControllers', [])

export function useAPIInfo () {
    const clashx = useAtomValue(clashxConfigAtom)
    const location = useLocation()
    const localStorage = useAtomValue(localStorageAtom)

    if (clashx != null) {
        return clashx
    }

    let url: URL | undefined
    {
        const meta = document.querySelector<HTMLMetaElement>('meta[name="external-controller"]')
        if ((meta?.content?.match(/^https?:/)) != null) {
            // [protocol]://[secret]@[hostname]:[port]
            url = new URL(meta.content)
        }
    }

    const qs = new URLSearchParams(location.search)

    const hostname = qs.get('host') ?? localStorage?.[0]?.hostname ?? url?.hostname ?? '127.0.0.1'
    const port = qs.get('port') ?? localStorage?.[0]?.port ?? url?.port ?? '9090'
    const secret = qs.get('secret') ?? localStorage?.[0]?.secret ?? url?.username ?? ''
    const protocol = qs.get('protocol') ?? localStorage?.[0]?.protocol

    return { hostname, port, secret, protocol }
}

const clientAtom = atom({
    key: '',
    instance: null as Client | null,
})

export function useClient () {
    const {
        hostname,
        port,
        secret,
        protocol,
    } = useAPIInfo()
    const [item, setItem] = useAtom(clientAtom)
    const key = `${protocol}://${hostname}:${port}?secret=${secret}`
    if (item.key === key) {
        return item.instance!
    }

    const client = new Client(`${protocol}://${hostname}:${port}`, secret)
    setItem({ key, instance: client })

    return client
}
