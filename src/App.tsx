import React, { useEffect, useState } from 'react';
import { Button, Form, Input, notification } from 'antd';
import { ethers, ContractTransaction, ContractReceipt } from 'ethers';
import { abi, contractAddress } from './constants';
import './App.css';

const App = () => {
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    console.log('window.ethereum: ', window.ethereum);
    getBalanceHandler();
  }, []);

  const listenForTransactionMine = (txResponse: ContractTransaction, provider: ethers.providers.Web3Provider) => {
    console.log('Mining ', txResponse.hash);
    return new Promise<void>((resolve, reject) => {
      provider.once(txResponse.hash, (txReceipt: ContractReceipt) => {
        console.log('Completed with ', txReceipt.confirmations, ' confrmations');
        resolve();
      });
    });
  }

  const connectHandler = async () => {
    if(!window.ethereum) {
      notification['warning']({
        message: 'Please install metamask',
      });
      return;
    }
    await window.ethereum.request({method: 'eth_requestAccounts'});
  }

  const getBalanceHandler = async () => {
    if(!window.ethereum) {
      notification['warning']({
        message: 'Please install metamask',
      });
      return;
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(contractAddress);
    setBalance(ethers.utils.formatEther(balance));
  }

  const fundHandler = async (e: { fundAmount: string }) => {
    if(!window.ethereum) {
      notification['warning']({
        message: 'Please install metamask',
      });
      return;
    }
    const { fundAmount } = e;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try { 
      const txResponse: ContractTransaction = await contract.fund({value: ethers.utils.parseEther(fundAmount)});
      await listenForTransactionMine(txResponse, provider);
      notification['success']({
        message: 'Done!',
        duration: 0,
      });
    } catch(error: any) {
      notification['error']({
        message: 'error: ' + error.message,
      });
    }
  }

  const withdrawHandler = async () => {
    if(!window.ethereum) {
      notification['warning']({
        message: 'Please install metamask',
      });
      return;
    }
    notification['info']({
      message: 'Withdrawing...',
    });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try{
      const txResponse: ContractTransaction = await contract.withdraw();
      await listenForTransactionMine(txResponse, provider);
      notification['success']({
        message: 'Done!',
        duration: 0,
      });
    } catch(error: any) {
      notification['error']({
        message: 'error: ' + error.message,
      });
    }
  }

  return (
    <div className="App">
      <div className="header">
        Connect With Metamask Wallet To Fund Smart Contract
        <br />
        Smart Contract Balance: {balance}
      </div>
      <div className="connect">
        <Button type="primary" onClick={connectHandler}>Connect Metamask</Button>
        <div className="divider" />
        <Button type="primary" onClick={getBalanceHandler}>GetBalance</Button>
        <div className="divider" />
        <Button type="primary" onClick={withdrawHandler}>Withdraw</Button>
        <br />
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          initialValues={{ remember: true }}
          onFinish={fundHandler}
          style = {{ "width": "25%", "marginTop": "20px"}}
        >
        <Form.Item
          label="fund amount"
          name="fundAmount"
          rules={[{ required: true, message: 'Please input fund amount' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Fund
          </Button>
        </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default App;
