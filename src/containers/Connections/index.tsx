import { useIntersectionObserver, useSyncedRef } from '@react-hookz/web/esm'
import { useTable, columnFilterRowsFn, createTable, sortRowsFn } from '@tanstack/react-table'
import classnames from 'classnames'
import produce from 'immer'
import { groupBy } from 'lodash-es'
import { useMemo, useLayoutEffect, useRef, useState, useEffect } from 'react'

import { Header, Checkbox, Modal, Icon, Drawer, Card, Button } from '@components'
import { fromNow } from '@lib/date'
import { basePath, formatTraffic } from '@lib/helper'
import { useObject, useVisible } from '@lib/hook'
import * as API from '@lib/request'
import { BaseComponentProps } from '@models'
import { useClient, useConnectionStreamReader, useI18n } from '@stores'

import { Devices } from './Devices'
import { ConnectionInfo } from './Info'
import { Connection, FormatConnection, useConnections } from './store'
import './style.scss'

enum Columns {
    Host = 'host',
    Network = 'network',
    Process = 'process',
    Type = 'type',
    Chains = 'chains',
    Rule = 'rule',
    Speed = 'speed',
    Upload = 'upload',
    Download = 'download',
    SourceIP = 'sourceIP',
    Time = 'time',
}

const shouldCenter = new Set<string>([Columns.Network, Columns.Type, Columns.Speed, Columns.Upload, Columns.Download, Columns.SourceIP, Columns.Time, Columns.Process])

function formatSpeed (upload: number, download: number) {
    switch (true) {
        case upload === 0 && download === 0:
            return '-'
        case upload !== 0 && download !== 0:
            return `↑ ${formatTraffic(upload)}/s ↓ ${formatTraffic(download)}/s`
        case upload !== 0:
            return `↑ ${formatTraffic(upload)}/s`
        default:
            return `↓ ${formatTraffic(download)}/s`
    }
}

const table = createTable<{ Row: FormatConnection }>()

export default function Connections () {
    const { translation, lang } = useI18n()
    const t = useMemo(() => translation('Connections').t, [translation])
    const connStreamReader = useConnectionStreamReader()
    const client = useClient()
    const cardRef = useRef<HTMLDivElement>(null)

    // total
    const [traffic, setTraffic] = useObject({
        uploadTotal: 0,
        downloadTotal: 0,
    })

    // close all connections
    const { visible, show, hide } = useVisible()
    function handleCloseConnections () {
        client.closeAllConnections().finally(() => hide())
    }

    // connections
    const { connections, feed, save, toggleSave } = useConnections()
    const data: FormatConnection[] = useMemo(() => connections.map(
        c => ({
            id: c.id,
            host: `${c.metadata.host || c.metadata.destinationIP}:${c.metadata.destinationPort}`,
            chains: c.chains.slice().reverse().join(' / '),
            rule: c.rulePayload ? `${c.rule} :: ${c.rulePayload}` : c.rule,
            time: new Date(c.start).getTime(),
            upload: c.upload,
            download: c.download,
            sourceIP: c.metadata.sourceIP,
            type: c.metadata.type,
            network: c.metadata.network.toUpperCase(),
            process: c.metadata.processPath,
            speed: { upload: c.uploadSpeed, download: c.downloadSpeed },
            completed: !!c.completed,
            original: c,
        }),
    ), [connections])
    const devices = useMemo(() => {
        const gb = groupBy(connections, 'metadata.sourceIP')
        return Object.keys(gb)
            .map(key => ({ label: key, number: gb[key].length }))
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [connections])

    // table
    const pinRef = useRef<HTMLTableCellElement>(null)
    const intersection = useIntersectionObserver(pinRef, { threshold: [1] })
    const columns = useMemo(
        () => table.createColumns([
            table.createDataColumn(Columns.Host, { minWidth: 260, width: 260, header: t(`columns.${Columns.Host}`) }),
            table.createDataColumn(Columns.Network, { minWidth: 80, width: 80, header: t(`columns.${Columns.Network}`) }),
            table.createDataColumn(Columns.Type, { minWidth: 100, width: 100, header: t(`columns.${Columns.Type}`) }),
            table.createDataColumn(Columns.Chains, { minWidth: 200, width: 200, header: t(`columns.${Columns.Chains}`) }),
            table.createDataColumn(Columns.Rule, { minWidth: 140, width: 140, header: t(`columns.${Columns.Rule}`) }),
            table.createDataColumn(Columns.Process, { minWidth: 100, width: 100, header: t(`columns.${Columns.Process}`), cell: cell => cell.value ? basePath(cell.value) : '-' }),
            table.createDataColumn(
                row => [row.speed.upload, row.speed.download],
                {
                    id: Columns.Speed,
                    header: t(`columns.${Columns.Speed}`),
                    minWidth: 200,
                    width: 200,
                    sortDescFirst: true,
                    sortType (rowA, rowB) {
                        const speedA = rowA.original?.speed ?? { upload: 0, download: 0 }
                        const speedB = rowB.original?.speed ?? { upload: 0, download: 0 }
                        return speedA.download === speedB.download
                            ? speedA.upload - speedB.upload
                            : speedA.download - speedB.download
                    },
                    cell: cell => formatSpeed(cell.value[0], cell.value[1]),
                },
            ),
            table.createDataColumn(Columns.Upload, { minWidth: 100, width: 100, header: t(`columns.${Columns.Upload}`), cell: cell => formatTraffic(cell.value) }),
            table.createDataColumn(Columns.Download, { minWidth: 100, width: 100, header: t(`columns.${Columns.Download}`), cell: cell => formatTraffic(cell.value) }),
            table.createDataColumn(Columns.SourceIP, { minWidth: 140, width: 140, header: t(`columns.${Columns.SourceIP}`), filterType: 'equals' }),
            table.createDataColumn(
                Columns.Time,
                {
                    minWidth: 120,
                    width: 120,
                    header: t(`columns.${Columns.Time}`),
                    cell: cell => fromNow(new Date(cell.value), lang),
                    sortType: (rowA, rowB) => (rowB.original?.time ?? 0) - (rowA.original?.time ?? 0),
                },
            ),
        ]),
        [lang, t],
    )

    useLayoutEffect(() => {
        function handleConnection (snapshots: API.Snapshot[]) {
            for (const snapshot of snapshots) {
                setTraffic({
                    uploadTotal: snapshot.uploadTotal,
                    downloadTotal: snapshot.downloadTotal,
                })

                feed(snapshot.connections)
            }
        }

        connStreamReader?.subscribe('data', handleConnection)
        return () => {
            connStreamReader?.unsubscribe('data', handleConnection)
            connStreamReader?.destory()
        }
    }, [connStreamReader, feed, setTraffic])

    const instance = useTable(table, {
        data,
        columns,
        sortRowsFn,
        columnFilterRowsFn,
        initialState: {
            sorting: [{ id: Columns.Time, desc: false }],
        },
        columnResizeMode: 'onChange',
        enableColumnResizing: true,
        autoResetSorting: false,
        autoResetColumnFilters: false,
    })

    const headerGroup = instance.getHeaderGroups()[0]

    // filter
    const [device, setDevice] = useState('')
    function handleDeviceSelected (label: string) {
        setDevice(label)
        instance.setColumnFilterValue(Columns.SourceIP, label || undefined)
    }

    // click item
    const [drawerState, setDrawerState] = useObject({
        visible: false,
        selectedID: '',
        connection: {} as Partial<Connection>,
    })
    function handleConnectionClosed () {
        setDrawerState(d => { d.connection.completed = true })
        client.closeConnection(drawerState.selectedID)
    }
    const latestConntion = useSyncedRef(drawerState.connection)
    useEffect(() => {
        const conn = data.find(c => c.id === drawerState.selectedID)?.original
        if (conn) {
            setDrawerState(d => {
                d.connection = { ...conn }
                if (drawerState.selectedID === latestConntion.current.id) {
                    d.connection.completed = latestConntion.current.completed
                }
            })
        } else if (Object.keys(latestConntion.current).length !== 0 && !latestConntion.current.completed) {
            setDrawerState(d => { d.connection.completed = true })
        }
    }, [data, drawerState.selectedID, latestConntion, setDrawerState])

    const scrolled = useMemo(() => (intersection?.intersectionRatio ?? 0) < 1, [intersection])
    const headers = headerGroup.headers.map((header, idx) => {
        const column = header.column
        const id = column.id
        return (
            <th
                {...header.getHeaderProps(
                    (props: BaseComponentProps) => produce(props, props => {
                        props.className = classnames('connections-th', {
                            resizing: column.getIsResizing(),
                            fixed: column.id === Columns.Host,
                            shadow: scrolled && column.id === Columns.Host,
                        })
                        !props.style && (props.style = {})
                        props.style.width = header.getWidth()
                    }),
                )}
                ref={column.id === Columns.Host ? pinRef : undefined}
                key={id}>
                <div {...column.getToggleSortingProps()}>
                    {header.renderHeader()}
                    {
                        column.getIsSorted() !== false
                            ? column.getIsSorted() === 'desc' ? ' ↓' : ' ↑'
                            : null
                    }
                </div>
                { idx !== headerGroup.headers.length - 1 &&
                    <div {...header.getResizerProps()} className="connections-resizer" />
                }
            </th>
        )
    })

    const content = instance.getRowModel().rows.map(row => {
        return (
            <tr
                {...row.getRowProps()}
                className="cursor-default select-none"
                key={row.original?.id}
                onClick={() => setDrawerState({ visible: true, selectedID: row.original?.id })}>
                {
                    row.getAllCells().map(cell => {
                        const classname = classnames(
                            'connections-block',
                            { 'text-center': shouldCenter.has(cell.column.id), completed: row.original?.completed },
                            {
                                fixed: cell.column.id === Columns.Host,
                                shadow: scrolled && cell.column.id === Columns.Host,
                            },
                        )
                        return (
                            <td
                                {...cell.getCellProps(
                                    (props: BaseComponentProps) => produce(props, props => {
                                        !props.style && (props.style = {})
                                        props.className = classname
                                        props.style.width = cell.column.getWidth()
                                    }),
                                )}
                                key={cell.column.id}>
                                { cell.renderCell() }
                            </td>
                        )
                    })
                }
            </tr>
        )
    })

    return (
        <div className="page !h-100vh">
            <Header title={t('title')}>
                <span className="cursor-default flex-1 connections-filter">
                    {`(${t('total.text')}: ${t('total.upload')} ${formatTraffic(traffic.uploadTotal)} ${t('total.download')} ${formatTraffic(traffic.downloadTotal)})`}
                </span>
                <Checkbox className="connections-filter" checked={save} onChange={toggleSave}>{t('keepClosed')}</Checkbox>
                <Icon className="connections-filter dangerous" onClick={show} type="close-all" size={20} />
            </Header>
            { devices.length > 1 && <Devices devices={devices} selected={device} onChange={handleDeviceSelected} /> }
            <Card ref={cardRef} className="connections-card relative">
                <div className="overflow-auto min-h-full min-w-full">
                    <table {...instance.getTableProps()}>
                        <thead>
                            <tr {...headerGroup.getHeaderGroupProps()} className="connections-header">
                                { headers }
                            </tr>
                        </thead>

                        <tbody {...instance.getTableBodyProps()}>
                            { content }
                        </tbody>
                    </table>
                </div>
            </Card>
            <Modal title={t('closeAll.title')} show={visible} onClose={hide} onOk={handleCloseConnections}>{t('closeAll.content')}</Modal>
            <Drawer containerRef={cardRef} visible={drawerState.visible} width={450}>
                <div className="flex h-8 justify-between items-center">
                    <span className="font-bold pl-3">{t('info.title')}</span>
                    <Icon type="close" size={16} className="cursor-pointer" onClick={() => setDrawerState('visible', false)} />
                </div>
                <ConnectionInfo className="mt-3 px-5" connection={drawerState.connection} />
                <div className="flex mt-3 pr-3 justify-end">
                    <Button type="danger" disiabled={drawerState.connection.completed} onClick={() => handleConnectionClosed()}>{ t('info.closeConnection') }</Button>
                </div>
            </Drawer>
        </div>
    )
}
