async function getForwardingAddress(address) {
    const domain = this.parseDomain(address);
    const records = await dns.resolveTxtAsync(domain);

    // dns TXT record must contain `forward-email=` prefix
    const validRecords = [];

    // add support for multi-line TXT records
    for (let i = 0; i < records.length; i++) {
      records[i] = records[i].join(''); // join chunks together
      if (records[i].startsWith('forward-email='))
        validRecords.push(records[i].replace('forward-email=', ''));
    }

    // join multi-line TXT records together and replace double w/single commas
    const record = validRecords
      .join(',')
      .replace(/,+/g, ',')
      .trim();

    // if the record was blank then throw an error
    if (s.isBlank(record)) throw invalidTXTError;

    // e.g. hello@niftylettuce.com => niftylettuce@gmail.com
    // record = "forward-email=hello:niftylettuce@gmail.com"
    // e.g. hello+test@niftylettuce.com => niftylettuce+test@gmail.com
    // record = "forward-email=hello:niftylettuce@gmail.com"
    // e.g. *@niftylettuce.com => niftylettuce@gmail.com
    // record = "forward-email=niftylettuce@gmail.com"
    // e.g. *+test@niftylettuce.com => niftylettuce@gmail.com
    // record = "forward-email=niftylettuce@gmail.com"

    // remove trailing whitespaces from each address listed
    const addresses = record.split(',').map(a => a.trim());

    if (addresses.length === 0) throw invalidTXTError;

    // store if we have a forwarding address or not
    let forwardingAddress;

    // store if we have a global redirect or not
    let globalForwardingAddress;

    // check if we have a specific redirect and store global redirects (if any)
    // get username from recipient email address
    // (e.g. hello@niftylettuce.com => hello)
    const username = this.parseUsername(address);

    for (let i = 0; i < addresses.length; i++) {
      // convert addresses to lowercase
      addresses[i] = addresses[i].toLowerCase();
      if (addresses[i].indexOf(':') === -1) {
        if (
          validator.isFQDN(this.parseDomain(addresses[i])) &&
          validator.isEmail(addresses[i])
        )
          globalForwardingAddress = addresses[i];
      } else {
        const address = addresses[i].split(':');

        if (address.length !== 2) throw invalidTXTError;

        // address[0] = hello (username)
        // address[1] = niftylettuce@gmail.com (forwarding email)

        // check if we have a match
        if (username === address[0]) {
          forwardingAddress = address[1];
          break;
        }
      }
    }

    // if we don't have a specific forwarding address try the global redirect
    if (!forwardingAddress && globalForwardingAddress)
      forwardingAddress = globalForwardingAddress;

    // if we don't have a forwarding address then throw an error
    if (!forwardingAddress) throw invalidTXTError;

    // otherwise transform the + symbol filter if we had it
    // and then resolve with the newly formatted forwarding address
    if (address.indexOf('+') === -1) return forwardingAddress;

    return `${this.parseUsername(forwardingAddress)}+${this.parseFilter(
      address
    )}@${this.parseDomain(forwardingAddress)}`;
}
