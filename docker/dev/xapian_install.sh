
#!/usr/bin/env bash
# first argument of the script is Xapian version (e.g. 1.2.19)
VERSION=$1

# prepare
mkdir $VIRTUAL_ENV/packages && cd $VIRTUAL_ENV/packages

CORE=xapian-core-$VERSION
BINDINGS=xapian-bindings-$VERSION

# download
echo "Downloading source..."
curl -O https://oligarchy.co.uk/xapian/$VERSION/${CORE}.tar.xz
curl -O https://oligarchy.co.uk/xapian/$VERSION/${BINDINGS}.tar.xz

# extract
echo "Extracting source..."
tar xf ${CORE}.tar.xz
tar xf ${BINDINGS}.tar.xz

# install
echo "Installing Xapian-core..."
cd $VIRTUAL_ENV/packages/${CORE}
./configure --prefix=$VIRTUAL_ENV && make && make install

PYV=`python -c "import sys;t='{v[0]}'.format(v=list(sys.version_info[:1]));sys.stdout.write(t)";`

if [ $PYV = "2" ]; then
    PYTHON_FLAG=--with-python
else
    PYTHON_FLAG=--with-python3
fi

echo "Installing Xapian-bindings..."
cd $VIRTUAL_ENV/packages/${BINDINGS}
./configure --prefix=$VIRTUAL_ENV $PYTHON_FLAG XAPIAN_CONFIG=$VIRTUAL_ENV/bin/xapian-config && make && make install

# clean
# rm -rf $VIRTUAL_ENV/packages

# test
python -c "import xapian"
