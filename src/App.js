import { useState, useEffect } from 'react'
import SocialX from './utils/SocialX.json'

import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import Spinner from 'react-bootstrap/Spinner'
const ethers = require("ethers")
const dayjs = require('dayjs')


const CONTRACT_ADDRESS = "0xDb1B2670e64c07C0034F1d3d6377838B0408AB20"
const CONTRACT_ABI = SocialX.abi
const SEPOLIA_CHAIN_ID = "0xaa36a7"

const { ethereum } = window

const findMetamaskWallet = async () => {

  const accounts = await ethereum.request({ method: 'eth_accounts' })
  const account = accounts[0]

  let chainId = await ethereum.request({ method: 'eth_chainId' })

  if (chainId !== SEPOLIA_CHAIN_ID) {
    return alert("You are not connected to the Sepolia Test Network!")
  }

  if (account?.length > 0) {
    return account
  }
  else {
    return alert('No account found.')
  }
}


const App = () => {

  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isHateLoading, setIsHateLoading] = useState(false)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)
  const [curentAccount, setCurentAccount] = useState(null)
  const [input, setInput] = useState(null)
  const [maxContentLength, setMaxContentLength] = useState(0)
  const [errorMessage, setErrorMessage] = useState(null)
  const [posts, setPosts] = useState([])

  const isDisabled = () => {
    if (isHateLoading || isLikeLoading || isSubmitLoading) {
      return true
    }
  }

  let signer = null
  let provider
  let contract

  const getEthersParams = async () => {
    if (window.ethereum == null) {
      alert("MetaMask not installed; using read-only defaults")
      provider = ethers.getDefaultProvider()
      contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    }
    else {
      provider = new ethers.BrowserProvider(window.ethereum)
      signer = await provider.getSigner();
      contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    }
  }

  useEffect(() => {
    if (!ethereum) {
      alert('Make sure that metamask is installed.')
      return null
    }
    findMetamaskWallet()
      .then(async (account) => {
        if (account) {
          setCurentAccount(account)
          await fetchAllPosts()
          await getMaxContentLength()
        }
      })

  }, [])

  const connectMetamaskWallet = async () => {
    try {
      setIsSubmitLoading(true)

      if (!ethereum) {
        alert('Please install Metamask')
        return null
      }

      let chainId = await ethereum.request({ method: 'eth_chainId' })

      if (chainId !== SEPOLIA_CHAIN_ID) {
        return alert("You are not connected to the Sepolia Test Network!")
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      const account = accounts[0]
      setCurentAccount(account)

      window.location.reload(false)
    }
    catch (err) {
      setErrorMessage(err.message)
      setTimeout(() => {
        setErrorMessage(null)
      }, 3000)
      return null
    }
    finally {
      setIsSubmitLoading(false)
    }
  }

  const getMaxContentLength = async () => {
    try {
      await getEthersParams()

      const _maxContentLength = await contract.MAX_TWEET_LENGTH()
      setMaxContentLength(_maxContentLength)
    }
    catch (err) {
      console.log(err.message)
    }
  }

  const fetchAllPosts = async () => {
    try {
      await getEthersParams()
      const allPosts = await contract.getAllPosts()
      setPosts(allPosts)
    }
    catch (err) {
      setErrorMessage(err.message)
      setTimeout(() => {
        setErrorMessage(null)
      }, 3000)
    }
  }

  const onTypeSomething = (e) => {
    e.preventDefault()
    setInput(e.target.value)
  }

  const onCreatePost = async (e) => {
    e.preventDefault()
    setIsSubmitLoading(true)
    try {
      if (input?.length > 0) {
        await getEthersParams()
        const postCreation = await contract.createPost(input)
        await postCreation.wait()

        await fetchAllPosts()

        setInput('')
      }
      else {
        setErrorMessage("Content cannot be null")
        setTimeout(() => {
          setErrorMessage(null)
        }, 3000)
      }
    }
    catch (err) {
      setErrorMessage(err.message)
      setTimeout(() => {
        setErrorMessage(null)
      }, 3000)
    }
    finally {
      setIsSubmitLoading(false)
    }
  }

  const onLikePost = async (_author, _postId) => {
    try {
      setIsLikeLoading(true)
      await getEthersParams()
      const postLike = await contract.likePost(_author, _postId)
      await postLike.wait()

      await fetchAllPosts()
    }
    catch (err) {
      setErrorMessage(err.message)
      setTimeout(() => {
        setErrorMessage(null)
      }, 3000)
    }
    finally {
      setIsLikeLoading(false)
    }
  }

  const onHatePost = async (_author, _postId) => {
    try {
      setIsHateLoading(true)
      await getEthersParams()
      const postUnlike = await contract.unlikePost(_author, _postId)
      await postUnlike.wait()

      await fetchAllPosts()

      window.location.reload(false)
    }
    catch (err) {
      setErrorMessage(err.message)
      setTimeout(() => {
        setErrorMessage(null)
      }, 3000)
    }
    finally {
      setIsHateLoading(false)
    }
  }

  const formatAddress = (address) => {
    return `${address?.substring(0, 5)}...${address?.substring(address?.length - 5)}`
  }

  const formatTime = (timestamp) => {
    let newTimestamp = new Date(Number(timestamp) * 1000)
    let currentDate = new Date()

    let diff = currentDate - newTimestamp

    if (diff < 60000) {
      return 'Just now'
    }
    else if (diff < 3600000) {
      return 'Less than an hour ago'
    }
    else if (diff < 86400000) {
      return `${dayjs(newTimestamp).get('hour')}h ago`
    }
    else {
      return `${dayjs(newTimestamp).get('day')}d ago`
    }

  }

  return (
    <div className="App">
      {errorMessage !== null &&
        <div className='main-alert font-medium'>
          {errorMessage}
        </div>
      }

      {curentAccount ?
        <div className='font-medium header'>
          {formatAddress(curentAccount)}
        </div>
        :
        <button
          onClick={connectMetamaskWallet}
          className='connect-btn'>
          Connect
        </button>
      }
      <h1>SocialX</h1>
      <p className='font-medium'>
        This runs on the sepolia network. <a rel="noreferrer" href='https://github.com/Neph-dev/socialX_contract' target='_blank'>View code</a>
      </p>

      <div className='full-width-justify-center'>
        <div className='glass-bg'>

          <div className='post-card'>
            <textarea
              className='post-input'
              onChange={onTypeSomething}
              autoFocus={true}
              value={input}
              autoComplete='off'
              maxLength={maxContentLength}
              autoCorrect='on'
              placeholder='Type something...'
              name='type-something' />

            {isSubmitLoading ?
              <Spinner animation="grow" />
              :
              <div className='full-width-justify-between'>
                <div>
                  <button
                    onClick={onCreatePost}
                    disabled={isDisabled()}
                    className='send-button'>
                    Send
                  </button>
                </div>
                <div className='font-small'>
                  {input?.length ?? 0}/{Number(maxContentLength)}
                </div>
              </div>
            }
          </div>
          {posts.map((post, index) => (
            <div key={index} className='post-card'>
              <div className='post-card-header'>
                <div className='font-small'>
                  {formatAddress(post.author)}
                </div>
                <div className='font-small'>
                  {formatTime(post.timestamp)}
                </div>
              </div>

              <div className='post-card-content font-medium'>
                {post.content}
              </div>

              <div className="post-card-footer font-medium">
                {isLikeLoading ?
                  <Spinner animation="grow" />
                  :
                  <>
                    <button onClick={() => onLikePost(post.author, post.id)} disabled={isDisabled()}>🤗</button> <div>{Number(post.likes)}</div>
                  </>
                }
                <div className='width-separator' />
                {isHateLoading ?
                  <Spinner animation="grow" />
                  :
                  <>
                    <button onClick={() => onHatePost(post.author, post.id)} disabled={isDisabled()}>🤬</button> <div>{Number(post.hates)}</div>
                  </>
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div >
  );
}

export default App;
