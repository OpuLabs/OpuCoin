#!/usr/bin/env bash

# Based on https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/scripts/test.sh

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the testrpc instance that we started (if we started one and if it's still running).
  if [ -n "$testrpc_pid" ] && ps -p $testrpc_pid > /dev/null; then
    kill -9 $testrpc_pid
  fi
}

testrpc_running() {
  nc -z localhost 8545
}

if testrpc_running; then
  echo "Using existing testrpc instance"
else
  echo "Starting our own testrpc instance"
    ganache-cli \
    --account="0x8dd61f3464bee60c6041872eabfb69347789fbb8545c9fa432bde4a45618896d, 10000000000000000000000000" \
    --account="0xd0dd57cefeb6322227851f1593e73e9422b53d6c35517bef06990c1ef5fc5f0f, 10000000000000000000000000" \
    --account="0x60b17f4968e1710647126ea97046e36aadcc5e2f81bba575138e1e06edfdcfca, 10000000000000000000000000" \
    --account="0x88e75f7aecf14e85ea576f536674e7c9fc6f1b76fae3cc0b4b14693687bd4614, 10000000000000000000000000" \
    --account="0x2b9eb3758153571a60d0ba131f3654348eb3599162bb958f374f691f3fd6bf6f, 10000000000000000000000000" \
    --account="0xec600b5555a30fcf9f1b06a2f17b0f538a7233ea2babb5aa3ceecaa28cbb7c78, 10000000000000000000000000" \
    --account="0x9299fd17464274decc93b4f6b17e60afe5ba6cdd9d607631e7bf316762e7d5a4, 10000000000000000000000000" \
    --account="0x6e65c4f0532598640446209a7403e151b3be3e7b988b43006910f7cf06f78713, 10000000000000000000000000" \
    --account="0x39b1a0948ad9b0662cb1bb20888b60a7dfb161778000ca6d518aacefe51c1b67, 10000000000000000000000000" \
    --account="0x2b01e7562afafb5227ba1041595c7a52664367b9a9835bc1aa488431dbb44354, 10000000000000000000000000" \
    -l \
    45000000000 \
  > /dev/null &
  testrpc_pid=$!
fi

node_modules/.bin/truffle test --network development --timeout 40000 "$@"