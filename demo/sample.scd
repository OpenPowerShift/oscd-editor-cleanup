<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  version="2007" revision="B">
  <Header id="ACME_DoAnything_ICD" version="1.0" revision="A" toolID="ACME SCL Generator"
    nameStructure="IEDName" />
  <Communication>
    <SubNetwork name="StationBus" type="8-MMS">
      <ConnectedAP iedName="TEMPLATE" apName="AP1">
        <Address>
          <P type="IP">192.168.1.10</P>
          <P type="IP-SUBNET">255.255.255.0</P>
          <P type="IP-GATEWAY">192.168.1.1</P>
        </Address>
        <GSE ldInst="LD_PROT" cbName="CBStatus">
          <Address>
            <P type="MAC-Address">01-0C-CD-01-00-01</P>
            <P type="APPID">0001</P>
            <P type="VLAN-ID">001</P>
            <P type="VLAN-PRIORITY">3</P>
          </Address>
          <MinTime unit="s" multiplier="m">4</MinTime>
          <MaxTime unit="s" multiplier="m">1000</MaxTime>
        </GSE>
        <GSE ldInst="LD_PROT" cbName="UnusedGSEControl">
          <Address>
            <P type="MAC-Address">01-0C-CD-01-00-01</P>
            <P type="APPID">0001</P>
            <P type="VLAN-ID">001</P>
            <P type="VLAN-PRIORITY">3</P>
          </Address>
          <MinTime unit="s" multiplier="m">4</MinTime>
          <MaxTime unit="s" multiplier="m">1000</MaxTime>
        </GSE>
        <GSE ldInst="LD_PROT" cbName="Trip">
          <Address>
            <P type="MAC-Address">01-0C-CD-01-00-01</P>
            <P type="APPID">0001</P>
            <P type="VLAN-ID">003</P>
            <P type="VLAN-PRIORITY">5</P>
          </Address>
          <MinTime unit="s" multiplier="m">4</MinTime>
          <MaxTime unit="s" multiplier="m">1000</MaxTime>
        </GSE>
        <SMV ldInst="LD_PROT" cbName="UnusedSampledValueControl">
          <Address>
            <P type="MAC-Address">01-0C-CD-04-00-01</P>
            <P type="APPID">4001</P>
            <P type="VLAN-ID">002</P>
            <P type="VLAN-PRIORITY">6</P>
          </Address>
        </SMV>
        <SMV ldInst="LD_PROT" cbName="Currents">
          <Address>
            <P type="MAC-Address">01-0C-CD-04-00-01</P>
            <P type="APPID">4001</P>
            <P type="VLAN-ID">002</P>
            <P type="VLAN-PRIORITY">6</P>
          </Address>
        </SMV>
      </ConnectedAP>
    </SubNetwork>
  </Communication>
  <IED name="TEMPLATE" manufacturer="ACME Inc" type="DoAnything" configVersion="1.0">
    <AccessPoint name="AP1">
      <Server>
        <Authentication />
        <LDevice inst="LD_PROT">
          <LN0 lnClass="LLN0" inst="" lnType="LLN0_Type">
            <DataSet name="CBStatus">
              <FCDA ldInst="LD_PROT" lnClass="XCBR" lnInst="1" doName="Pos"
                daName="stVal" fc="ST" />
              <FCDA ldInst="LD_PROT" lnClass="XCBR" lnInst="1" doName="Pos"
                daName="q" fc="ST" />
            </DataSet>
            <DataSet name="Currents">
              <FCDA ldInst="LD_PROT" lnClass="TCTR" lnInst="1" doName="AmpSv"
                daName="instMag.f" fc="MX" />
              <FCDA ldInst="LD_PROT" lnClass="TCTR" lnInst="1" doName="AmpSv"
                daName="instMag.q" fc="MX" />
              <FCDA ldInst="LD_PROT" lnClass="TCTR" lnInst="2" doName="AmpSv"
                daName="instMag.f" fc="MX" />
              <FCDA ldInst="LD_PROT" lnClass="TCTR" lnInst="2" doName="AmpSv"
                daName="instMag.q" fc="MX" />
              <FCDA ldInst="LD_PROT" lnClass="TCTR" lnInst="3" doName="AmpSv"
                daName="instMag.f" fc="MX" />
              <FCDA ldInst="LD_PROT" lnClass="TCTR" lnInst="3" doName="AmpSv"
                daName="instMag.q" fc="MX" />
            </DataSet>
            <DataSet name="Trip">
              <FCDA ldInst="LD_PROT" lnClass="PTRC" lnInst="1" doName="Tr"
                daName="stVal" fc="ST" />
              <FCDA ldInst="LD_PROT" lnClass="PTRC" lnInst="1" doName="Tr"
                daName="q" fc="ST" />
            </DataSet>
            <DataSet name="CleanMeUp">
              <FCDA ldInst="LD_PROT" lnClass="PTRC" lnInst="1" doName="Tr"
                daName="stVal" fc="ST" />
              <FCDA ldInst="LD_PROT" lnClass="PTRC" lnInst="1" doName="Tr"
                daName="q" fc="ST" />
            </DataSet>
            <ReportControl name="Unused_Report" intgPd="3600000" confRev="1"
              buffered="true" bufTime="500" indexed="false"
              rptID="Unused_SCADA_Indication">
              <TrgOps dchg="true" qchg="true" dupd="false" period="true" gi="true" />
              <OptFields seqNum="true" timeStamp="true" dataSet="true"
                reasonCode="true" dataRef="false" entryID="true" configRef="false"
                bufOvfl="true" />
              <RptEnabled max="1" />
            </ReportControl>
            <LogControl name="UnusedLogControl" intgPd="3600000"
              prefix=""
              logName="UnusedLogControl"
              logEna="true"
              reasonCode="true">
              <TrgOps dchg="true" qchg="true" />
            </LogControl>
            <GSEControl name="CBStatus" type="GOOSE" appID="0001" datSet="CBStatus"
              confRev="1" fixedOffs="false" />
            <GSEControl name="Trip" type="GOOSE" appID="0001" datSet="Trip"
              confRev="1" fixedOffs="false" />
            <GSEControl name="UnusedGSEControl" type="GOOSE" appID="0001"
              confRev="1" fixedOffs="false" />
            <SampledValueControl name="Currents" datSet="Currents" smvID="ACME_SV_1"
              confRev="1" smpRate="80" nofASDU="1" multicast="true"
              smpMod="SmpPerPeriod">
              <SmvOpts refreshTime="false" sampleSynchronized="true"
                sampleRate="false" dataSet="false" security="false" />
            </SampledValueControl>
            <SampledValueControl name="UnusedSampledValueControl" smvID="ACME_SV_1"
              confRev="1" smpRate="80" nofASDU="1" multicast="true"
              smpMod="SmpPerPeriod">
              <SmvOpts refreshTime="false" sampleSynchronized="true"
                sampleRate="false" dataSet="false" security="false" />
            </SampledValueControl>
          </LN0>
          <LN lnClass="XCBR" inst="1" lnType="XCBR_Type" desc="Circuit breaker position">
            <Inputs>
              <ExtRef serviceType="GOOSE"
                intAddr="XCBR1.Pos.stVal" />
              <ExtRef serviceType="GOOSE"
                intAddr="XCBR1.Pos.q" />
            </Inputs>
          </LN>
          <LN lnClass="PTRC" inst="1" lnType="PTRC_Type" desc="Trip baby trip!">
            <Inputs>
              <ExtRef serviceType="GOOSE"
                intAddr="PTRC1.Tr.stVal" desc="CB Trip" />
              <ExtRef serviceType="GOOSE"
                intAddr="PTRC1.Tr.q" desc="CB Trip Quality" />
            </Inputs>
          </LN>
          <LN lnClass="TCTR" inst="1" lnType="TCTR_Type" desc="Red phase">
            <Inputs>
              <ExtRef serviceType="SMV"
                intAddr="TCTR1.AmpSv.instMag.f" desc="Red phase" />
              <ExtRef serviceType="SMV"
                intAddr="TCTR1.AmpSv.q" desc="Red phase Quality" />
            </Inputs>
          </LN>
          <LN lnClass="TCTR" inst="2" lnType="TCTR_Type" desc="White phase">
            <Inputs>
              <ExtRef serviceType="SMV"
                intAddr="TCTR2.AmpSv.instMag.f" desc="White phase" />
              <ExtRef serviceType="SMV"
                intAddr="TCTR2.AmpSv.q" desc="White phase Quality" />
            </Inputs>
          </LN>
          <LN lnClass="TCTR" inst="3" lnType="TCTR_Type" desc="Blue phase">
            <Inputs>
              <ExtRef serviceType="SMV"
                intAddr="TCTR3.AmpSv.instMag.f" desc="Blue phase" />
              <ExtRef serviceType="SMV"
                intAddr="TCTR3.AmpSv.q" />
            </Inputs>
          </LN>
        </LDevice>
      </Server>
    </AccessPoint>
  </IED>
  <DataTypeTemplates>
    <LNodeType id="LLN0_Type" lnClass="LLN0">
      <DO name="Mod" type="SPS_DOType" />
    </LNodeType>
    <LNodeType id="XCBR_Type" lnClass="XCBR">
      <DO name="Pos" type="DPC_DOType" />
    </LNodeType>
    <LNodeType id="PTRC_Type" lnClass="PTRC">
      <DO name="Tr" type="SPS_DOType" />
    </LNodeType>
    <LNodeType id="TCTR_Type" lnClass="TCTR">
      <DO name="AmpSv" type="MV_DOType" />
    </LNodeType>
    <LNodeType id="UnusedTCTR_Type" lnClass="TCTR">
      <DO name="AmpSv" type="MV_DOType" />
    </LNodeType>
    <DOType id="DPC_DOType" cdc="DPC">
      <DA name="stVal" bType="Enum" type="DbPosKind_Enum" fc="ST" />
      <DA name="q" bType="Quality" fc="ST" />
      <DA name="t" bType="Timestamp" fc="ST" />
    </DOType>
    <DOType id="SPS_DOType" cdc="SPS">
      <DA name="stVal" bType="BOOLEAN" fc="ST" />
      <DA name="q" bType="Quality" fc="ST" />
      <DA name="t" bType="Timestamp" fc="ST" />
    </DOType>
    <DOType id="MV_DOType" cdc="MV">
      <DA name="instMag" bType="Struct" type="AnalogueValue_Type" fc="MX" />
      <DA name="q" bType="Quality" fc="MX" />
      <DA name="t" bType="Timestamp" fc="MX" />
    </DOType>
    <DOType id="UnusedMV_DOType" cdc="MV">
      <DA name="instMag" bType="Struct" type="AnalogueValue_Type" fc="MX" />
      <DA name="q" bType="Quality" fc="MX" />
      <DA name="t" bType="Timestamp" fc="MX" />
    </DOType>
    <DAType id="AnalogueValue_Type">
      <BDA name="f" bType="FLOAT32" />
    </DAType>
    <DAType id="UnusedAnalogueValue_Type">
      <BDA name="f" bType="FLOAT32" />
    </DAType>
    <EnumType id="DbPosKind_Enum">
      <EnumVal ord="0">intermediate-state</EnumVal>
      <EnumVal ord="1">off</EnumVal>
      <EnumVal ord="2">on</EnumVal>
      <EnumVal ord="3">bad-state</EnumVal>
    </EnumType>
    <EnumType id="UnusedDbPosKind_Enum">
      <EnumVal ord="0">intermediate-state</EnumVal>
      <EnumVal ord="1">off</EnumVal>
      <EnumVal ord="2">on</EnumVal>
      <EnumVal ord="3">bad-state</EnumVal>
    </EnumType>
  </DataTypeTemplates>
</SCL>