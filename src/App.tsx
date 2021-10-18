import * as React from "react";
import { ChakraProvider, Box, Grid, theme } from "@chakra-ui/react";
import { ColorModeSwitcher } from "./ColorModeSwitcher";
import { ENR } from "@chainsafe/discv5";
import { PortalNetwork } from "portalnetwork";
import PeerId from "peer-id";
import { Multiaddr } from "multiaddr";
import ShowInfo from "./Components/ShowInfo";
import AddressBookManager from "./Components/AddressBookManager";

export const App = () => {
  const [portal, setDiscv5] = React.useState<PortalNetwork>();
  const [enr, setENR] = React.useState<string>();

  React.useEffect(() => {
    if (portal) {
      setENR(portal.discv5.enr.encodeTxt(portal.discv5.keypair.privateKey));
    }
  }, [portal]);
  const init = async () => {
    const id = await PeerId.create({ keyType: "secp256k1" });
    const enr = ENR.createFromPeerId(id);
    enr.setLocationMultiaddr(new Multiaddr("/ip4/127.0.0.1/udp/0"));
    const portal = new PortalNetwork({
      enr: enr,
      peerId: id,
      multiaddr: new Multiaddr("/ip4/127.0.0.1/udp/0"),
      transport: "wss",
      proxyAddress: "ws://127.0.0.1:5050",
    });
    //@ts-ignore
    window.discv5 = portal.discv5;
    //@ts-ignore
    window.Multiaddr = Multiaddr;
    //@ts-ignore
    window.ENR = ENR;
    setDiscv5(portal);
    await portal.discv5.start();
    portal.discv5.enableLogs();
    console.log("started discv5", portal.discv5.isStarted());
    setENR(portal.discv5.enr.encodeTxt(portal.discv5.keypair.privateKey));
    portal.discv5.on("discovered", (msg) => console.log(msg));
    portal.discv5.on("talkReqReceived", (srcId, enr, msg) =>
      console.log("content requested", msg.request.toString())
    );
    //  discv5.on("talkRespReceived", (srcId, enr, msg) => console.log(`got back a response - ${msg.response.toString()} to request ${msg.id}`))
  };

  React.useEffect(() => {
    init();
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <Box textAlign="center" fontSize="xl">
        <Grid minH="50vh" p={3}>
          <ColorModeSwitcher justifySelf="flex-end" />
          {portal && (
            <>
              <ShowInfo discv5={portal.discv5} />
              <AddressBookManager portal={portal} />
            </>
          )}
        </Grid>
      </Box>
    </ChakraProvider>
  );
};;
