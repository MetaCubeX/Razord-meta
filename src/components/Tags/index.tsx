import classnames from 'classnames'
import { useState, useRef, useLayoutEffect } from 'react'

import { noop } from '@lib/helper'
import { BaseComponentProps } from '@models'
import { useI18n } from '@stores'
import './style.scss'

interface TagsProps extends BaseComponentProps {
    data: string[]
    onClick: (name: string) => void
    errSet?: Set<string>
    select: string
    rowHeight: number
    canClick: boolean
}

export function Tags (props: TagsProps) {
    const { className, data, onClick, select, canClick, errSet, rowHeight: rawHeight } = props

    const { translation } = useI18n()
    const { t } = translation('Proxies')
    const [expand, setExpand] = useState(false)
    const [showExtend, setShowExtend] = useState(false)

    const ulRef = useRef<HTMLUListElement>(null)
    useLayoutEffect(() => {
        setShowExtend((ulRef?.current?.offsetHeight ?? 0) > 35)
    }, [])

    const rowHeight = expand ? 'auto' : rawHeight
    const handleClick = canClick ? onClick : noop

    function toggleExtend () {
        setExpand(!expand)
    }

    const tags = data
        .map(t => {
            const tagClass = classnames({ 'tags-selected': select === t, 'cursor-pointer': canClick, error: errSet?.has(t) })
            return (
                <li className={tagClass} key={t} onClick={() => handleClick(t)}>
                    { t }
                </li>
            )
        })

    return (
        <div className={classnames('flex items-start overflow-y-hidden', className)} style={{ height: rowHeight }}>
            <ul ref={ulRef} className={classnames('tags', { expand })}>
                { tags }
            </ul>
            {
                showExtend &&
                <span className="h-7 px-5 select-none cursor-pointer leading-7" onClick={toggleExtend}>{ expand ? t('collapseText') : t('expandText') }</span>
            }
        </div>
    )
}
