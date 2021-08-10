#!/bin/sh

conda create --name fairseq3 python=3.7 -y
conda activate fairseq

sudo apt-get install liblzma-dev libbz2-dev libzstd-dev libsndfile1-dev libopenblas-dev libfftw3-dev libgflags-dev libgoogle-glog-dev
sudo apt install build-essential cmake libboost-system-dev libboost-thread-dev libboost-program-options-dev libboost-test-dev libeigen3-dev zlib1g-dev libbz2-dev liblzma-dev

pip install packaging soundfile swifter
pip install -r requirements.txt
touch model_config.json
cd /opt
sudo mkdir wav2vec
sudo chmod 777 -R wav2vec
cd wav2vec
git clone https://github.com/Open-Speech-EkStep/fairseq -b v2-hydra
cd fairseq
pip install -e .
cd ..

git clone https://github.com/kpu/kenlm.git
cd kenlm
mkdir -p build && cd build
cmake .. 
make -j 16
cd ..
export KENLM_ROOT=$PWD
cd ..
if [ ! -d flashlight ]; then
  git clone https://github.com/flashlight/flashlight.git
fi
cd flashlight/bindings/python
export USE_MKL=0
python setup.py install

sudo apt-get update && apt-get install -y libsndfile1 ffmpeg
pip install git+https://github.com/Open-Speech-EkStep/indic-punct.git#egg=indic-punct
conda install -c conda-forge pynini==2.1.4 -y
conda install libgcc gmp
pip install Cython
pip install nemo_toolkit['all']==v1.0.2

if [ ! -d denoiser ]; then
  git clone https://github.com/facebookresearch/denoiser.git
fi
