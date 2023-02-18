import { useMemo } from "react";
import { Card, Tag, Icon, Loading } from "@components";
import { Progress } from "@components/Progress";
import { compareDesc } from "@containers/Proxies";
import { Proxy } from "@containers/Proxies/components/Proxy";
import { fromNow } from "@lib/date";
import { useVisible } from "@lib/hook";
import { Provider as IProvider, Proxy as IProxy } from "@lib/request";
import { useClient, useI18n, useProxyProviders } from "@stores";
import "./style.scss";

interface ProvidersProps {
    provider: IProvider;
}

export function Provider(props: ProvidersProps) {
    const { update } = useProxyProviders();
    const { translation, lang } = useI18n();
    const client = useClient();

    const { provider } = props;
    const { t } = translation("Proxies");

    const { visible, hide, show } = useVisible();

    function handleHealthChech() {
        show();
        client
            .healthCheckProvider(provider.name)
            .then(async () => await update())
            .finally(() => hide());
    }
    const expireStr = useMemo(() => {
        if (!provider.subscriptionInfo?.Expire) {
            return
        }

        const expire = new Date(provider.subscriptionInfo.Expire * 1000);
        const getYear = expire.getFullYear().toString() + "-";
        const getMonth =
            (expire.getMonth() + 1 < 10
                ? "0" + (expire.getMonth() + 1).toString()
                : expire.getMonth() + 1
            ).toString() + "-";
        const getDate = expire.getDate().toString() + " ";
        return getYear + getMonth + getDate;
    }, [provider.subscriptionInfo]);
    function handleUpdate() {
        show();
        client
            .updateProvider(provider.name)
            .then(async () => await update())
            .finally(() => hide());
    }

    const proxies = useMemo(() => {
        return (provider.proxies as IProxy[])
            .slice()
            .sort((a, b) => -1 * compareDesc(a, b));
    }, [provider.proxies]);

    return (
        <Card className="proxy-provider">
            <Loading visible={visible} />
            <div className="flex flex-col justify-between md:(flex-row items-center)">
                <div className="flex items-center flex-wrap gap-4">
                    <span className="mr-2">{provider.name}</span>
                    <Tag>{provider.vehicleType}</Tag>
                    <Tag className="rule-provider-behavior m-0">
                        {provider.proxies.length}
                    </Tag>
                    {expireStr && (
                        <Tag className="rule-provider-expire m-0">
                            Expire: {expireStr}
                        </Tag>
                    )}
                    {provider.subscriptionInfo && (
                        <Progress
                            subscriptionInfo={provider.subscriptionInfo}
                        />
                    )}
                </div>

                <div className="flex pt-3 items-center md:pt-0 flex-none">
                    {provider.updatedAt && (
                        <span className="text-sm">{`${t(
                            "providerUpdateTime"
                        )}: ${fromNow(
                            new Date(provider.updatedAt),
                            lang
                        )}`}</span>
                    )}
                    <Icon
                        className="cursor-pointer text-red pl-5"
                        type="healthcheck"
                        size={18}
                        onClick={handleHealthChech}
                    />
                    <Icon
                        className="cursor-pointer pl-5"
                        type="update"
                        size={18}
                        onClick={handleUpdate}
                    />
                </div>
            </div>
            <ul className="proxies-list">
                {proxies.map((p: IProxy) => (
                    <li key={p.name}>
                        <Proxy className="proxy-provider-item" config={p} />
                    </li>
                ))}
            </ul>
        </Card>
    );
}
