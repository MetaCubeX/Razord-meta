import { useAtom } from 'jotai'
import { useUpdateAtom } from 'jotai/utils'
import { useEffect } from 'react'

import { Modal, Input, Alert, ButtonSelect, ButtonSelectOptions } from '@components'
import { useObject } from '@lib/hook'
import { useI18n, useAPIInfo, identityAtom } from '@stores'
import { localStorageAtom } from '@stores/request'
import './style.scss'

const protocolOptions: ButtonSelectOptions[] = [
    { label: 'HTTP', value: 'http' },
    { label: 'HTTPS', value: 'https' },
]

export default function ExternalController () {
    const { translation } = useI18n()
    const { t } = translation('Settings')
    const { hostname, port, secret, protocol } = useAPIInfo()
    const [identity, setIdentity] = useAtom(identityAtom)
    const [value, set] = useObject({
        hostname: '',
        port: '',
        secret: '',
        protocol: '',
    })

    useEffect(() => {
        set({ hostname, port, secret, protocol })
    }, [hostname, port, secret, protocol, set])

    const setter = useUpdateAtom(localStorageAtom)

    function handleOk () {
        const { hostname, port, secret, protocol } = value
        setter([{ hostname, port, secret, protocol: protocol as 'http' | 'https' }])
    }

    return (
        <Modal
            show={!identity}
            title={t('externalControllerSetting.title')}
            bodyClassName="external-controller"
            onClose={() => setIdentity(true)}
            onOk={handleOk}
        >
            <Alert type="info" inside={true}>
                <p>{t('externalControllerSetting.note')}</p>
            </Alert>
            <div className="flex items-center">
                <span className="font-bold my-1 w-14 md:my-3">{t('externalControllerSetting.host')}</span>
                <Input
                    className="flex-1 my-1 md:my-3"
                    align="left"
                    inside={true}
                    value={value.hostname}
                    onChange={hostname => set('hostname', hostname)}
                    onEnter={handleOk}
                />
            </div>
            <div className="flex items-center">
                <div className="font-bold my-1 w-14 md:my-3">{t('externalControllerSetting.port')}</div>
                <Input
                    className="flex-1 my-1 w-14 md:my-3"
                    align="left"
                    inside={true}
                    value={value.port}
                    onChange={port => set('port', port)}
                    onEnter={handleOk}
                />
            </div>
            <div className="flex items-center">
                <div className="font-bold my-1 w-14 md:my-3">{t('externalControllerSetting.secret')}</div>
                <Input
                    className="flex-1 my-1 w-14 md:my-3"
                    align="left"
                    inside={true}
                    value={value.secret}
                    onChange={secret => set('secret', secret)}
                    onEnter={handleOk}
                />
            </div>
            <div className="flex items-center">
                <div className="fobutton-selectnt-bold my-1 w-14 md:my-3">{t('externalControllerSetting.protocol')}</div>
                <ButtonSelect
                    className="flex-1 my-1 w-14 md:my-3"
                    options={protocolOptions}
                    value={value.protocol}
                    onSelect={protocol => set('protocol', protocol)}
                />
            </div>
        </Modal>
    )
}
